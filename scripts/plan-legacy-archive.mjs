#!/usr/bin/env node
// Read-only planner. It never renames, deletes, rewrites, or archives a Session.
import { readdir, readFile, realpath, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { createRequire } from 'node:module';
import { domainSpec } from '../host.js';
import { PRIVATE_STORAGE, mountPrivatePersistence, canonicalStorageRoot, isWithin, verifyLegacyOwner, verifyPrefix } from '../persistence.js';

async function fingerprint(directory, prefix = '') {
  const files = [];
  for (const entry of await readdir(join(directory, prefix), { withFileTypes: true })) {
    const path = join(prefix, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Refusing symbolic link: ${join(directory, path)}`);
    if (entry.isDirectory()) files.push(...await fingerprint(directory, path));
    else if (entry.isFile()) {
      const bytes = await readFile(join(directory, path));
      files.push({ path, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
    } else throw new Error(`Unsupported file: ${join(directory, path)}`);
  }
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

/** Requires a stopped Host; produces evidence for a separately reviewed directory move. */
export async function buildArchivePlan(options, runtime, z) {
  const legacyRoot = await realpath(options.legacyRoot);
  const privateRoot = await realpath(options.privateRoot);
  const archiveRoot = await canonicalStorageRoot(options.archiveRoot);
  for (const root of [privateRoot, archiveRoot]) {
    if (isWithin(legacyRoot, root) || isWithin(root, legacyRoot)) throw new Error('Archive/private storage must be outside the main Session root.');
  }
  if (isWithin(privateRoot, archiveRoot) || isWithin(archiveRoot, privateRoot)) throw new Error('Archive and private roots must be separate.');
  const schema = domainSpec(z).tables.threads.valueSchema;
  const legacy = await mountPrivatePersistence(legacyRoot, runtime, options.legacyCompression ?? 'none');
  let target;
  try {
    target = await mountPrivatePersistence(privateRoot, runtime, options.privateCompression ?? 'zstd');
    const plan = { version: 1, generatedAt: new Date().toISOString(), requiresStoppedHost: true,
      legacyRoot, privateRoot, archiveRoot,
      instructions: [
        'Keep every Host using these roots stopped throughout review, move, verification, and any rollback.',
        'Save this plan. Recheck all source SHA256 values; refuse any changed file or existing destination.',
        'Create archiveRoot outside the main root. Move each entire sourceDirectory to its exact archiveDirectory without replacement; preserve all generation and lock files.',
        'Verify archived file SHA256 values against this plan and confirm the sourceDirectory is absent before restarting the Host.',
        'Rollback while the Host is stopped: verify archive hashes, require sourceDirectory to be absent, then move archiveDirectory back to sourceDirectory without replacement. Do not alter the private history or index.',
      ], entries: [], skipped: [] };
    for (const file of await readdir(options.threadsDir, { withFileTypes: true })) {
      if (!file.name.endsWith('.json')) continue;
      if (!file.isFile()) throw new Error(`Not a regular index document: ${file.name}`);
      const document = JSON.parse(await readFile(join(options.threadsDir, file.name), 'utf8'));
      if (document.version !== 1) throw new Error(`Unsupported index version: ${file.name}`);
      const meta = schema.parse(document.record);
      if (!/^btw-[a-z0-9-]+$/i.test(meta.id)) throw new Error(`Unexpected legacy session id: ${meta.id}`);
      if (file.name !== `${meta.id}.json`) throw new Error(`Index filename/id mismatch: ${file.name}`);
      if (meta.storage !== PRIVATE_STORAGE) { plan.skipped.push({ id: meta.id, reason: 'not yet migrated' }); continue; }
      if (!await legacy.persistence.stat(meta.id)) { plan.skipped.push({ id: meta.id, reason: 'no main copy' }); continue; }
      const source = await legacy.persistence.open(meta.id, 'read');
      let destination;
      try {
        destination = await target.persistence.open(meta.id, 'read');
        const oldEvents = (await source.read()).events, newEvents = (await destination.read()).events;
        verifyLegacyOwner(meta, source.header, oldEvents);
        if (!isDeepStrictEqual(source.header, destination.header) || source.inheritedEventCount !== destination.inheritedEventCount) throw new Error(`Header mismatch: ${meta.id}`);
        verifyPrefix(newEvents, oldEvents);
        const matches = [];
        for (const project of await readdir(legacyRoot, { withFileTypes: true })) {
          if (!project.isDirectory()) continue;
          for (const child of await readdir(join(legacyRoot, project.name), { withFileTypes: true })) {
            if (child.name === meta.id) {
              if (!child.isDirectory()) throw new Error(`Not a session directory: ${meta.id}`);
              matches.push(join(legacyRoot, project.name, child.name));
            }
          }
        }
        if (matches.length !== 1) throw new Error(`Expected one source directory for ${meta.id}; found ${matches.length}`);
        const archiveDirectory = join(archiveRoot, meta.id);
        try { await stat(archiveDirectory); throw new Error(`Archive destination already exists: ${archiveDirectory}`); }
        catch (error) { if (error.code !== 'ENOENT') throw error; }
        plan.entries.push({ id: meta.id, sourceDirectory: matches[0], archiveDirectory,
          legacyEventCount: oldEvents.length, privateEventCount: newEvents.length,
          files: await fingerprint(matches[0]) });
      } finally { try { await destination?.close(); } finally { await source.close(); } }
    }
    return plan;
  } finally { try { await target?.dispose(); } finally { await legacy.dispose(); } }
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.includes('--host-stopped')) throw new Error('Stop all Hosts using these storage roots, then pass --host-stopped.');
  const value = flag => { const i = args.indexOf(flag); return i < 0 ? undefined : args[i + 1]; };
  const home = value('--home');
  if (!home) throw new Error('Usage: node scripts/plan-legacy-archive.mjs --host-stopped --home /absolute/dsh-home [--legacy-root PATH] [--legacy-compression none|zstd]');
  const requireRuntime = createRequire(process.env.BTW_DSH_PACKAGE_JSON ?? import.meta.resolve('@deepseek-ai/dsh-session'));
  const { z } = await import(pathToFileURL(requireRuntime.resolve('zod')).href);
  const options = {
    legacyRoot: value('--legacy-root') ?? join(home, 'sessions'), privateRoot: join(home, 'btw', 'sessions'),
    archiveRoot: join(home, 'btw', 'legacy-archive'), threadsDir: join(home, 'storages', 'dsh_btw', 'threads'),
    legacyCompression: value('--legacy-compression') ?? 'none',
  };
  if (!['none', 'zstd'].includes(options.legacyCompression)) throw new Error('Unsupported compression.');
  process.stdout.write(JSON.stringify(await buildArchivePlan(options, undefined, z), null, 2) + '\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { process.stderr.write(error.message + '\n'); process.exitCode = 1; });
}
