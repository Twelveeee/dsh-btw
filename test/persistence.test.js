import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, realpath, rm, mkdir, writeFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, basename, dirname } from 'node:path';
import { BtwService, domainSpec } from '../host.js';
import { mountPrivatePersistence, migrateLegacyThread, PRIVATE_STORAGE } from '../persistence.js';
import { buildArchivePlan } from '../scripts/plan-legacy-archive.mjs';

const requireRuntime = createRequire(process.env.BTW_DSH_PACKAGE_JSON ?? import.meta.url);
const load = name => import(requireRuntime.resolve(name));
const [{ Context }, session, llm, jsonl, { Storage }, { JsonStorageBackend }, { DomainFacility }, { z }] = await Promise.all([
  load('@deepseek-ai/cordis'), load('@deepseek-ai/dsh-session'), load('@deepseek-ai/dsh-llm'),
  load('@deepseek-ai/dsh-session-persistence-jsonl'), load('@deepseek-ai/dsh-storage'),
  load('@deepseek-ai/dsh-storage-json'), load('@deepseek-ai/dsh-storage-domain'), load('zod'),
]);
const runtime = { ...session, ...llm };

test('real JSONL sessions and JSON domain reopen preserve BTW history, model, and sequence', async () => {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'dsh-btw-persistence-test-')));
  const tempParent = await realpath(tmpdir());
  const opened = [];
  let calls = 0;
  async function mount() {
    const ctx = new Context();
    const persistence = ctx.plugin(jsonl, { root: join(root, 'sessions'), compression: 'none' });
    await persistence.await();
    const parentPersistence = ctx.sessionPersistence;
    const privateStore = await mountPrivatePersistence(join(root, 'btw-sessions'), { Context, jsonl });
    assert.equal(ctx.sessionPersistence.identity, parentPersistence.identity);
    assert.notEqual(privateStore.persistence.identity, parentPersistence.identity);
    const storage = new Storage(ctx);
    const backend = new JsonStorageBackend(join(root, 'domains'));
    const unregister = storage.backend.register('json', backend);
    const facility = new DomainFacility(ctx, { backend: 'json' });
    let domain;
    try { domain = await facility.open(domainSpec(z)); }
    catch (error) { unregister(); await backend.close(); await persistence.dispose(); throw error; }
    const sourceMessage = llm.createAssistantMessage({ source: { provider: 'source-provider', model: 'source-model' }, content: [{ type: 'text', text: 'Source answer' }] });
    const source = {
      session: { cwd: root }, inheritedEventCount: 0,
      events: [
        { seq: 0, type: 'user/message', data: llm.createUserMessage({ source: { kind: 'user' }, content: [{ type: 'text', text: 'Source question' }] }) },
        { seq: 1, type: 'assistant/message', data: { message: sourceMessage } },
      ],
    };
    const service = new BtwService({
      sessionPersistence: ctx.sessionPersistence,
      sessionQuery: { readSession: async () => structuredClone(source) },
      llm: {
        listProviders: () => [{ id: 'chosen-provider' }], listModels: async () => [{ id: 'chosen-model' }],
        stream: async function* (options) {
          calls++;
          assert.deepEqual(options.tools, []);
          assert.equal(options.provider, calls === 1 ? 'chosen-provider' : 'switched-provider');
          assert.equal(options.model, calls === 1 ? 'chosen-model' : 'switched-model');
          yield { type: 'text-delta', index: 0, text: 'Durable side answer' };
          yield { type: 'finish', reason: { kind: 'stop' } };
        },
      },
    }, domain, runtime, { persistence: privateStore.persistence, disposePersistence: privateStore.dispose });
    const fixture = { service, domain, ctx, sourceMessage, async close() {
      await service.dispose(); await facility.closeAll(); unregister(); await backend.close(); await persistence.dispose();
    } };
    opened.push(fixture);
    return fixture;
  }
  try {
    const first = await mount();
    await first.service.dispatch({ action: 'config', settings: { mode: 'fixed', provider: 'chosen-provider', model: 'chosen-model' } });
    const sourceSessionId = 'source-session';
    const original = (await first.service.dispatch({ action: 'open', sourceSessionId, messageId: first.sourceMessage.id })).thread;
    await first.service.dispatch({ action: 'send', sourceSessionId, threadId: original.id, text: 'Side question', requestId: 'one' });
    await Promise.all([...first.service.pending]);
    const settled = (await first.service.dispatch({ action: 'get', sourceSessionId, threadId: original.id })).thread;
    assert.equal(settled.status, 'idle');
    assert.deepEqual(await first.ctx.sessionPersistence.list(), [], 'private threads never enter the parent persistence list');
    assert.deepEqual(settled.messages.map(message => message.text), ['Side question', 'Durable side answer']);
    const switchedSettings = { mode:'fixed', provider:'switched-provider', model:'switched-model' };
    const switched = await first.service.dispatch({ action:'config', sourceSessionId, threadId:original.id, settings:switchedSettings });
    assert.deepEqual(switched.thread.messages, settled.messages);
    assert.equal(calls, 1);
    const storedBefore = first.service.threads.get(original.id).session.snapshotEvents();
    const finalSeq = storedBefore.at(-1).seq;
    await first.close(); opened.pop();

    // Entirely new backend instances: no first-service in-memory cache survives this boundary.
    const second = await mount();
    assert.deepEqual(second.domain.global.get(), { mode: 'fixed', provider: 'chosen-provider', model: 'chosen-model' });
    const restored = (await second.service.dispatch({ action: 'get', sourceSessionId, threadId: original.id })).thread;
    assert.deepEqual(restored.messages, settled.messages);
    assert.deepEqual(restored.model, { provider:'switched-provider', model:'switched-model' });
    assert.deepEqual((await second.service.dispatch({ action:'config', sourceSessionId, threadId:original.id })).settings, switchedSettings);
    assert.deepEqual(second.service.threads.get(original.id).session.requestHeader().config, { provider:'chosen-provider', model:'chosen-model' }, 'old request attribution stays unchanged until next send');
    await second.service.dispatch({ action:'send', sourceSessionId, threadId:original.id, text:'Next model', requestId:'two' });
    await Promise.all([...second.service.pending]);
    assert.equal(calls, 2);
    assert.equal(restored.sourceSeq, 1); assert.equal(restored.sourceMessageId, original.sourceMessageId);
    assert.equal(restored.contextCount, 2); assert.equal(restored.status, 'idle');
    const readHandle = await second.service.persistence.open(original.id, 'read');
    try {
      const { events } = await readHandle.read();
      assert(events.length > finalSeq);
      for (let index = 0; index < events.length; index++) assert.equal(events[index].seq, index);
      const rehydrated = session.Session.create(original.id, events, readHandle.header, readHandle.inheritedEventCount);
      const history = rehydrated.deriveMessages();
      assert(history.some(message => message.source.kind === 'dsh-btw' && message.content[0].text.includes('Source answer')));
      assert.equal(history.at(-1).content[0].text, 'Durable side answer');
      assert.deepEqual(rehydrated.requestHeader().config, restored.model);
    } finally { await readHandle.close(); }
    await second.service.dispatch({ action: 'send', sourceSessionId, threadId: original.id, text: 'Side question', requestId: 'one' });
    assert.equal(calls, 2, 'a retry after real-storage reopen must not generate twice');
    await second.close(); opened.pop();
    const third = await mount();
    const again = (await third.service.dispatch({ action:'get', sourceSessionId, threadId:original.id })).thread;
    assert.deepEqual(again.model, restored.model);
    assert.deepEqual(again.messages.map(message => message.text), ['Side question', 'Durable side answer', 'Next model', 'Durable side answer']);
    assert.deepEqual(third.service.threads.get(original.id).session.requestHeader().config, again.model);
  } finally {
    for (const item of opened.reverse()) await item.close();
    // Only delete the exact directory this test created, after resolving and checking it.
    assert.equal(dirname(root), tempParent);
    assert(basename(root).startsWith('dsh-btw-persistence-test-'));
    await rm(root, { recursive: true, force: true });
  }
});

test('legacy copy migration resumes a partial copy, survives failed publication, and reopens privately', async () => {
  const root = await mkdtemp(join(tmpdir(), 'btw-migration-'));
  const legacy = await mountPrivatePersistence(join(root, 'legacy'), { Context, jsonl }, 'none');
  let privateStore = await mountPrivatePersistence(join(root, 'private'), { Context, jsonl }, 'none');
  let opened;
  try {
    const id = 'btw-migration-test';
    const context = llm.createUserMessage({ source: { kind: 'dsh-btw', form: 'recall' }, content: [{ type: 'text', text: 'Frozen source context' }] });
    const canonical = session.Session.create(id, [], { version: session.SESSION_FORMAT_VERSION, id, createdAt: 1, isSeeded: false, parentSession: 'source', cwd: root });
    canonical.append('turn/start', { turn: 1 });
    canonical.append('step/start', { turn: 1, step: 1 });
    canonical.append('user/message', context, { surfaceOp: 'append' });
    canonical.append('step/end', { turn: 1, step: 1 });
    canonical.append('turn/end', { turn: 1, reason: { kind: 'completed' } });
    const events = canonical.snapshotEvents();
    const writer = await legacy.persistence.create(canonical.header);
    await writer.append(events); await writer.flush();
    const meta = { id, sourceSessionId: 'source', sourceMessageId: 'answer', sourceSeq: 1, createdAt: 1, contextMessageId: context.id,
      model: { provider: 'p', model: 'm' }, sourcePreview: 'source', contextCount: 1, contextChars: 21 };
    let indexed = meta;
    const table = { get: () => indexed, put: async (_id, value) => { indexed = value; } };
    await assert.rejects(migrateLegacyThread(meta, legacy.persistence, privateStore.persistence, table), /owned/i);
    assert.equal(await privateStore.persistence.stat(id), undefined);
    await writer.close();
    const partial = await privateStore.persistence.create(canonical.header);
    await partial.append(events.slice(0, 2)); await partial.flush(); await partial.close();
    await assert.rejects(migrateLegacyThread(meta, legacy.persistence, privateStore.persistence, { put: async () => { throw new Error('Index disk failure'); } }), /Index disk failure/);
    assert.equal(indexed.storage, undefined);
    // A fresh backend instance sees the completed copy even though its publication failed.
    await privateStore.dispose();
    privateStore = await mountPrivatePersistence(join(root, 'private'), { Context, jsonl }, 'none');
    const badReadback = {
      stat: id => privateStore.persistence.stat(id),
      open: async (id, access) => {
        const handle = await privateStore.persistence.open(id, access);
        return access === 'read' ? { header: handle.header, inheritedEventCount: handle.inheritedEventCount,
          read: async () => ({ events: [] }), close: () => handle.close() } : handle;
      },
    };
    await assert.rejects(migrateLegacyThread(indexed, legacy.persistence, badReadback, table), { code: 'MIGRATION_VERIFY' });
    assert.equal(indexed.storage, undefined, 'failed independent read-back must not publish the private route');
    const migrated = await migrateLegacyThread(indexed, legacy.persistence, privateStore.persistence, table);
    assert.equal(indexed.storage, PRIVATE_STORAGE);
    assert.deepEqual((await migrated.handle.read()).events, events);
    await migrated.handle.close();
    assert.deepEqual((await legacy.persistence.list()).map(item => item.header.id), [id], 'legacy copy is retained for offline archival');
    opened = new BtwService({ sessionPersistence: legacy.persistence }, { table: () => table, close: async () => {} }, runtime,
      { persistence: privateStore.persistence });
    const restored = (await opened.dispatch({ action: 'get', sourceSessionId: 'source', threadId: id })).thread;
    assert.equal(restored.id, id); assert.equal(restored.status, 'idle');
    assert.deepEqual(opened.threads.get(id).session.snapshotEvents().slice(0, events.length), events);
    await opened.dispose(); opened = null;
    const reader = await legacy.persistence.open(id, 'read');
    assert.deepEqual((await reader.read()).events, events); await reader.close();
    const threadsDir = join(root, 'threads'); await mkdir(threadsDir);
    await writeFile(join(threadsDir, `${id}.json`), JSON.stringify({ version: 1, record: indexed }));
    const plan = await buildArchivePlan({ legacyRoot: join(root, 'legacy'), privateRoot: join(root, 'private'),
      archiveRoot: join(root, 'archive'), threadsDir, legacyCompression: 'none', privateCompression: 'none' }, { Context, jsonl }, z);
    assert.equal(plan.entries.length, 1); assert.equal(plan.entries[0].id, id);
    assert(plan.entries[0].files.some(file => file.path.endsWith('.jsonl') && /^[a-f0-9]{64}$/.test(file.sha256)));
    assert((await stat(plan.entries[0].sourceDirectory)).isDirectory(), 'planner must not move the original');
    await assert.rejects(stat(plan.entries[0].archiveDirectory), { code: 'ENOENT' });
    await writeFile(join(threadsDir, `${id}.json`), JSON.stringify({ version: 1, record: { ...indexed, sourceSessionId: 'foreign' } }));
    await assert.rejects(buildArchivePlan({ legacyRoot: join(root, 'legacy'), privateRoot: join(root, 'private'),
      archiveRoot: join(root, 'archive'), threadsDir, privateCompression: 'none' }, { Context, jsonl }, z), { code: 'MIGRATION_OWNERSHIP' });
  } finally {
    await opened?.dispose(); await privateStore.dispose(); await legacy.dispose();
    await rm(root, { recursive: true, force: true });
  }
});

test('migration refuses divergent target events and forged ownership without publishing the index', async () => {
  const root = await mkdtemp(join(tmpdir(), 'btw-migration-conflict-'));
  const legacy = await mountPrivatePersistence(join(root, 'legacy'), { Context, jsonl }, 'none');
  const target = await mountPrivatePersistence(join(root, 'private'), { Context, jsonl }, 'none');
  try {
    const id = 'btw-conflict';
    const context = llm.createUserMessage({ source: { kind: 'dsh-btw', form: 'recall' }, content: [{ type: 'text', text: 'Source' }] });
    const canonical = session.Session.create(id, [], { version: session.SESSION_FORMAT_VERSION, id, createdAt: 1, isSeeded: false, parentSession: 'source', cwd: root });
    canonical.append('turn/start', { turn: 1 }); canonical.append('step/start', { turn: 1, step: 1 });
    canonical.append('user/message', context, { surfaceOp: 'append' });
    canonical.append('step/end', { turn: 1, step: 1 }); canonical.append('turn/end', { turn: 1, reason: { kind: 'completed' } });
    const events = canonical.snapshotEvents();
    const source = await legacy.persistence.create(canonical.header); await source.append(events); await source.close();
    const other = structuredClone(events); other.find(event => event.type === 'user/message').data.content[0].text = 'Conflicting copy';
    const destination = await target.persistence.create(canonical.header); await destination.append(other); await destination.close();
    const meta = { id, sourceSessionId: 'source', contextMessageId: context.id };
    let puts = 0;
    const table = { put: async () => { puts++; } };
    await assert.rejects(migrateLegacyThread(meta, legacy.persistence, target.persistence, table), { code: 'MIGRATION_CONFLICT' });
    await assert.rejects(migrateLegacyThread({ ...meta, sourceSessionId: 'foreign' }, legacy.persistence, target.persistence, table), { code: 'MIGRATION_OWNERSHIP' });
    assert.equal(puts, 0);
    const read = await target.persistence.open(id, 'read'); assert.deepEqual((await read.read()).events, other); await read.close();
  } finally { await target.dispose(); await legacy.dispose(); await rm(root, { recursive: true, force: true }); }
});
