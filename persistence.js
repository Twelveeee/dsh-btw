import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { resolve, relative, isAbsolute, sep, dirname, basename, join } from 'node:path';
import { realpath } from 'node:fs/promises';
import { assert } from './core.js';

export const PRIVATE_STORAGE = 'private-v1';
const VERSION = '0.2.1-rc.2';

// Resolve beside the peer Session package, not beside this plugin's devDependencies.
export async function loadPersistenceRuntime() {
  const anchor = process.env.BTW_DSH_PACKAGE_JSON ?? import.meta.resolve('@deepseek-ai/dsh-session');
  const runtime = createRequire(anchor);
  for (const name of ['@deepseek-ai/dsh-session', '@deepseek-ai/dsh-session-persistence-jsonl']) {
    const pkg = runtime(`${name}/package.json`);
    assert(pkg.version === VERSION, 'RUNTIME_VERSION', `${name} must be ${VERSION}; found ${pkg.version}.`);
  }
  const [cordis, jsonl] = await Promise.all([
    import(pathToFileURL(runtime.resolve('@deepseek-ai/cordis')).href),
    import(pathToFileURL(runtime.resolve('@deepseek-ai/dsh-session-persistence-jsonl')).href),
  ]);
  return { Context: cordis.Context, jsonl };
}

export function isWithin(parent, child) {
  const path = relative(resolve(parent), resolve(child));
  return path === '' || (!path.startsWith('..' + sep) && path !== '..' && !isAbsolute(path));
}

export async function canonicalStorageRoot(root) {
  let current = resolve(root);
  const suffix = [];
  for (;;) {
    try { return join(await realpath(current), ...suffix); }
    catch (error) {
      if (error.code !== 'ENOENT' || dirname(current) === current) throw error;
      suffix.unshift(basename(current)); current = dirname(current);
    }
  }
}

/** A separate owner prevents host-fiber disposal from racing the BTW flush barrier. */
export async function mountPrivatePersistence(root, runtime, compression = 'zstd') {
  const { Context, jsonl } = runtime ?? await loadPersistenceRuntime();
  const owner = new Context();
  const scope = owner.isolate('sessionPersistence');
  const provider = scope.plugin(jsonl, { root: resolve(root), compression });
  try {
    await provider.await();
    return { persistence: scope.sessionPersistence, dispose: () => provider.dispose() };
  } catch (error) {
    await provider.dispose();
    throw error;
  }
}

export function verifyLegacyOwner(meta, header, events) {
  assert(meta.id.startsWith('btw-') && header.id === meta.id && header.parentSession === meta.sourceSessionId,
    'MIGRATION_OWNERSHIP', 'The legacy session does not match the BTW index.');
  assert(events.some(event => event.type === 'user/message' && event.data.id === meta.contextMessageId && event.data.source?.kind === 'dsh-btw'),
    'MIGRATION_OWNERSHIP', 'The legacy session is missing its indexed BTW context message.');
}

export function verifyPrefix(source, target) {
  assert(target.length <= source.length && target.every((event, i) => isDeepStrictEqual(event, source[i])),
    'MIGRATION_CONFLICT', 'The private history differs from the legacy history.');
}

/** Copy under both write leases. Publish the index only after independent read-back. */
export async function migrateLegacyThread(meta, legacy, destination, table) {
  const source = await legacy.open(meta.id, 'write');
  let target;
  let published = false;
  try {
    const { events } = await source.read();
    verifyLegacyOwner(meta, source.header, events);
    const exists = await destination.stat(meta.id);
    target = exists
      ? await destination.open(meta.id, 'write')
      : await destination.create(source.header, { inheritedEventCount: source.inheritedEventCount });
    assert(isDeepStrictEqual(source.header, target.header) && source.inheritedEventCount === target.inheritedEventCount,
      'MIGRATION_CONFLICT', 'The private session metadata differs from the legacy session.');
    const copied = (await target.read()).events;
    verifyPrefix(events, copied);
    if (copied.length < events.length) await target.append(events.slice(copied.length));
    await target.flush();
    const reader = await destination.open(meta.id, 'read');
    try {
      const verified = (await reader.read()).events;
      assert(isDeepStrictEqual(reader.header, source.header) && reader.inheritedEventCount === source.inheritedEventCount && isDeepStrictEqual(verified, events),
        'MIGRATION_VERIFY', 'Private history read-back failed.');
    } finally { await reader.close(); }
    const migrated = { ...meta, storage: PRIVATE_STORAGE };
    await table.put(meta.id, migrated);
    // The target write lease stays with BtwService; no writer gap after publication.
    published = true;
    return { meta: migrated, handle: target };
  } finally {
    try { await source.close(); }
    catch (error) { published = false; throw error; }
    finally { if (!published && target) await target.close(); }
  }
}
