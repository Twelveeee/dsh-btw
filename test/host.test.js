import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BtwService, createRpcHandler, registerTool, RPC_ENDPOINT, domainSpec } from '../host.js';

// An installed DSH checkout may be used without installing or copying its dependencies.
const requireRuntime = createRequire(process.env.BTW_DSH_PACKAGE_JSON ?? import.meta.url);
const runtime = { ...await import(requireRuntime.resolve('@deepseek-ai/dsh-session')), ...await import(requireRuntime.resolve('@deepseek-ai/dsh-llm')) };
const { defineTool } = await import(requireRuntime.resolve('@deepseek-ai/dsh-tools'));
const { z } = await import(requireRuntime.resolve('zod'));
const request = (action, fields = {}) => ({ action, sourceSessionId: 'source', ...fields });
const clone = value => structuredClone(value);
function fixture(options = {}) {
  const records = new Map(), index = new Map(); let settings = { mode: 'follow' }, calls = 0, flushes = 0, failFlush = false;
  const source = { session: { cwd: '/example' }, inheritedEventCount: 0, events: [
    { seq: 0, type: 'user/message', data: { id: 'u', role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: 'Main question' }] } },
    { seq: 1, type: 'assistant/message', data: { message: { id: 'answer', role: 'assistant', source: { kind: 'model', provider: 'provider-a', model: 'model-a' }, content: [{ type: 'reasoning', text: 'HIDDEN' }, { type: 'text', text: 'Main answer' }] } } },
    { seq: 2, type: 'user/message', data: { id: 'later', role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: 'FUTURE' }] } },
  ] };
  const domain = {
    table: () => ({ get: id => index.get(id), entries: () => index.entries(), put: async (id, value) => { index.set(id, clone(value)); } }),
    global: { get: () => clone(settings), set: async value => { settings = clone(value); } }, close: async () => {},
  };
  const handle = record => ({
    header: record.header, inheritedEventCount: 0,
    read: async () => ({ events: clone(record.events), eventState: 'detached' }),
    append: async events => { assert.equal(events[0]?.seq ?? record.events.length, record.events.length); record.events.push(...clone(events)); },
    flush: async () => { if (failFlush) throw new Error('Disk full'); flushes++; },
    close: async () => { record.closed = true; },
  });
  const requests = [];
  const ctx = {
    sessionQuery: { readSession: async id => { assert.equal(id, 'source'); return clone(source); } },
    sessionPersistence: {
      create: async header => { assert(!records.has(header.id)); const record = { header, events: [] }; records.set(header.id, record); return handle(record); },
      open: async (id, access) => { assert.equal(access, 'write'); assert(records.has(id)); return handle(records.get(id)); },
    },
    llm: {
      listProviders: () => [{ id: 'provider-a', name: 'A' }], listModels: async () => [{ id: 'model-a', name: 'A model' }],
      stream: async function* (value) {
        calls++; requests.push(value);
        // The question is already durably committed when provider invocation starts.
        assert(flushes >= 2);
        const record = records.get(value.sessionId);
        assert(record.events.some(e => e.type === 'user/message' && e.data.source.kind === 'user'));
        assert.equal(value.tools.length, 0);
        if (options.stream) yield* options.stream(value);
        else { yield { type: 'text-delta', index: 0, text: 'Side answer' }; yield { type: 'finish', reason: { kind: 'stop' } }; }
      },
    },
  };
  const service = new BtwService(ctx, domain, runtime, { notifyIntervalMs: 5, ...options });
  return { service, ctx, domain, records, index, source, requests, calls: () => calls, flushes: () => flushes, failFlush: value => { failFlush = value; } };
}
async function open(f) { return (await f.service.dispatch(request('open', { messageId: 'answer' }))).thread; }
async function settled(f) { await Promise.all([...f.service.pending]); }

// These tests use the released Session and message classes, not permissive mocks.
test('real Session persistence, stable open, multi-turn context, and main isolation', async () => {
  const f = fixture(), before = JSON.stringify(f.source);
  const thread = await open(f), again = await open(f);
  assert.equal(thread.id, again.id); assert.equal(f.records.size, 1); assert.equal(thread.messages.length, 0);
  assert.deepEqual(thread.model, { provider: 'provider-a', model: 'model-a' });
  const started = await f.service.dispatch(request('send', { threadId: thread.id, text: 'Explain', requestId: 'one' }));
  assert.equal(started.thread.status, 'running'); await settled(f);
  const done = (await f.service.dispatch(request('get', { threadId: thread.id }))).thread;
  assert.equal(done.status, 'idle'); assert.deepEqual(done.messages.map(m => m.text), ['Explain', 'Side answer']);
  await f.service.dispatch(request('send', { threadId: thread.id, text: 'More', requestId: 'two' })); await settled(f);
  assert.equal(f.calls(), 2); assert.equal(f.requests[1].messages.filter(m => m.role === 'assistant').length, 1);
  const payload = JSON.stringify(f.requests);
  assert(!payload.includes('HIDDEN')); assert(!payload.includes('FUTURE')); assert.equal(JSON.stringify(f.source), before);
  const record = f.records.get(thread.id);
  assert.equal(record.events.at(-1).type, 'turn/end');
  const recreated = runtime.Session.create(thread.id, record.events, record.header);
  assert.deepEqual(recreated.deriveMessages(), f.service.threads.get(thread.id).session.deriveMessages());
  await f.service.dispose();
});

test('owner-only RPC fails closed and validates requests before business calls', async () => {
  const f = fixture(), handler = createRpcHandler(f.service);
  const controller = new AbortController();
  assert.equal((await handler(RPC_ENDPOINT, request('config'), controller.signal, { principal: { kind: 'api' } })).error.code, 'FORBIDDEN');
  assert.equal((await handler(RPC_ENDPOINT, { bad: true }, controller.signal, { principal: { kind: 'owner' } })).error.code, 'INVALID_REQUEST');
  const result = await handler(RPC_ENDPOINT, { action: 'config' }, controller.signal, { principal: { kind: 'owner' } });
  assert.equal(result.ok, true); assert.deepEqual(result.value.providers, [{ id: 'provider-a', name: 'A' }]);
  const directory = await handler(RPC_ENDPOINT, { action: 'models', provider: 'provider-a' }, controller.signal, { principal: { kind: 'owner' } });
  assert.equal(directory.ok, true); assert.deepEqual(directory.value.models, [{ id: 'model-a', name: 'A model' }]);
  const saved = await handler(RPC_ENDPOINT, { action: 'config', settings: { mode: 'fixed', provider: 'provider-a', model: 'model-a' } }, controller.signal, { principal: { kind: 'owner' } });
  assert.equal(saved.ok, true); assert.equal(saved.value.settings.mode, 'fixed');
  await f.service.dispose();
});

test('thread config exposes route capacity as optional read-only metadata', async () => {
  const f = fixture();
  try {
    const thread = await open(f), before = clone(f.records.get(thread.id).events);
    f.ctx.llm.resolveModelInfo = async (provider, model, signal) => {
      assert.equal(provider, thread.model.provider); assert.equal(model, thread.model.model);
      assert(signal instanceof AbortSignal);
      return { context:{ contextWindow:200000 } };
    };
    const result = await f.service.dispatch(request('config', { threadId:thread.id }));
    assert.equal(result.contextWindow, 200000);
    assert.equal(f.calls(), 0);
    assert.deepEqual(f.records.get(thread.id).events, before);
    f.ctx.llm.resolveModelInfo = async () => { throw new Error('metadata unavailable'); };
    const fallback = await f.service.dispatch(request('config', { threadId:thread.id }));
    assert.equal(fallback.contextWindow, undefined);
    assert.deepEqual(fallback.thread.model, thread.model);
  } finally { await f.service.dispose(); }
});

test('settings affect new threads only, and thread reads are source-bound', async () => {
  const f = fixture(), first = await open(f);
  await f.service.dispatch(request('config', { settings: { mode: 'fixed', provider: 'p2', model: 'm2' } }));
  assert.deepEqual((await open(f)).model, first.model);
  f.source.events.push({ ...clone(f.source.events[1]), seq: 3, data: { message: { ...clone(f.source.events[1].data.message), id: 'answer-2' } } });
  const second = (await f.service.dispatch(request('open', { messageId: 'answer-2' }))).thread;
  assert.deepEqual(second.model, { provider: 'p2', model: 'm2' });
  await assert.rejects(f.service.dispatch({ action: 'get', sourceSessionId: 'other', threadId: first.id }), { code: 'THREAD_NOT_FOUND' });
  await f.service.dispose();
});

test('idempotent retries, concurrent send rejection, cancellation preserves partial answer', async () => {
  const f = fixture({ stream: async function* ({ signal }) {
    yield { type: 'text-delta', index: 0, text: 'Partial' };
    await new Promise(resolve => { if (signal.aborted) resolve(); else signal.addEventListener('abort', resolve, { once: true }); });
  } });
  const thread = await open(f), send = request('send', { threadId: thread.id, text: 'Question', requestId: 'once' });
  await f.service.dispatch(send);
  await f.service.dispatch(send); assert.equal(f.calls(), 1);
  await assert.rejects(f.service.dispatch({ ...send, requestId: 'other' }), { code: 'THREAD_BUSY' });
  await assert.rejects(f.service.dispatch({ ...send, text: 'Different' }), { code: 'REQUEST_ID_CONFLICT' });
  await f.service.dispatch(request('stop', { threadId: thread.id })); await settled(f);
  const done = (await f.service.dispatch(request('get', { threadId: thread.id }))).thread;
  assert.equal(done.status, 'stopped'); assert.equal(done.messages.at(-1).text, 'Partial');
  assert(f.records.get(thread.id).events.find(e => e.type === 'assistant/message').data.interrupted);
  await f.service.dispose();
});

test('watch cancellation does not stop generation and idle watch waits for a change', async () => {
  const f = fixture({ stream: async function* ({ signal }) {
    await new Promise(resolve => { if (signal.aborted) resolve(); else signal.addEventListener('abort', resolve, { once: true }); });
  } });
  const thread = await open(f);
  let completed = false;
  const ctrl = new AbortController();
  const wait = f.service.dispatch(request('watch', { threadId: thread.id, afterRevision: thread.revision, timeoutMs: 800 }), ctrl.signal).finally(() => { completed = true; });
  await Promise.resolve(); assert.equal(completed, false); ctrl.abort();
  await assert.rejects(wait, { code: 'ABORTED' });
  await f.service.dispatch(request('send', { threadId: thread.id, text: 'Question', requestId: 'one' }));
  const running = (await f.service.dispatch(request('get', { threadId: thread.id }))).thread;
  const ctrl2 = new AbortController();
  const wait2 = f.service.dispatch(request('watch', { threadId: thread.id, afterRevision: running.revision, timeoutMs: 800 }), ctrl2.signal);
  ctrl2.abort(); await assert.rejects(wait2, { code: 'ABORTED' });
  assert(f.service.threads.get(thread.id).controller); assert.equal(f.service.threads.get(thread.id).controller.signal.aborted, false);
  await f.service.dispose();
});

test('storage failure prevents model call and marks thread as unsendable', async () => {
  const f = fixture(), thread = await open(f);
  f.failFlush(true);
  await assert.rejects(f.service.dispatch(request('send', { threadId: thread.id, text: 'Q', requestId: 'one' })), { code: 'PERSISTENCE_FAILED' });
  assert.equal(f.calls(), 0);
  await assert.rejects(f.service.dispatch(request('send', { threadId: thread.id, text: 'Q2', requestId: 'two' })), { code: 'PERSISTENCE_FAILED' });
  assert.equal((await f.service.dispatch(request('get', { threadId: thread.id }))).thread.status, 'error');
  await f.service.dispose();
});

test('restart rebuilds settled conversations exclusively from canonical events', async () => {
  const f = fixture(), thread = await open(f);
  await f.service.dispatch(request('send', { threadId: thread.id, text: 'Keep this', requestId: 'one' })); await settled(f);
  await f.service.dispose();
  const restored = new BtwService(f.ctx, f.domain, runtime);
  const value = (await restored.dispatch(request('get', { threadId: thread.id }))).thread;
  assert.equal(value.status, 'idle'); assert.deepEqual(value.messages.map(m => m.text), ['Keep this', 'Side answer']);
  await restored.dispatch(request('send', { threadId: thread.id, text: 'Keep this', requestId: 'one' }));
  assert.equal(f.calls(), 1);
  await restored.dispose();
});

test('restart marks orphaned generation interrupted without retrying it', async () => {
  const f = fixture(), thread = await open(f), stored = f.records.get(thread.id);
  const session = runtime.Session.create(thread.id, stored.events, stored.header);
  session.append('turn/start', { turn: 1 });
  session.append('user/message', runtime.createUserMessage({ content: [{ type: 'text', text: 'Unfinished' }], source: { kind: 'user' } }), { surfaceOp: 'append' });
  session.append('step/start', { turn: 1, step: 0 });
  stored.events = clone(session.snapshotEvents());
  await f.service.dispose();
  const restored = new BtwService(f.ctx, f.domain, runtime);
  const value = (await restored.dispatch(request('get', { threadId: thread.id }))).thread;
  assert.equal(value.status, 'error'); assert.match(value.error, /interrupted/); assert.equal(f.calls(), 0);
  assert.equal(stored.events.at(-1).data.reason.error.code, 'INTERRUPTED');
  await restored.dispose();
});

test('unexpected tools are never executed and model errors remain explicit', async () => {
  const f = fixture({ stream: async function* () { yield { type: 'tool-call-delta', index: 0, id: 'tool', name: 'bash', argumentsDelta: '{}' }; } });
  const thread = await open(f);
  await f.service.dispatch(request('send', { threadId: thread.id, text: 'Q', requestId: 'one' })); await settled(f);
  const value = (await f.service.dispatch(request('get', { threadId: thread.id }))).thread;
  assert.equal(value.status, 'error'); assert.match(value.error, /unsupported tool call/); assert.equal(value.messages.length, 1);
  await f.service.dispose();
  const failed = fixture({ stream: async function* () { yield { type: 'finish', reason: { kind: 'error', failure: { code: 'RATE_LIMIT', message: 'Please retry later' } } }; } });
  const t2 = await open(failed);
  await failed.service.dispatch(request('send', { threadId: t2.id, text: 'Q', requestId: 'one' })); await settled(failed);
  assert.equal((await failed.service.dispatch(request('get', { threadId: t2.id }))).thread.error, 'Please retry later');
  await failed.service.dispose();
});

test('domain schema and actual tool definition accept the implementation contract', async () => {
  const spec = domainSpec(z); assert.deepEqual(spec.global.schema.parse({ mode: 'follow' }), { mode: 'follow' });
  const f = fixture(), thread = await open(f); spec.tables.threads.valueSchema.parse(f.index.get(thread.id));
  let tool;
  registerTool({ tools: { register: value => { tool = value; } } }, f.service, defineTool);
  assert.equal(tool.name, 'btw_chat');
  const value = await tool.execute(request('get', { threadId: thread.id }), { agent: { session: { id: 'source' } }, signal: new AbortController().signal });
  assert(value);
  await assert.rejects(tool.execute({ action: 'config', settings: { mode: 'follow' } }, { agent: { session: { id: 'source' } }, signal: new AbortController().signal }), { code: 'FORBIDDEN' });
  await f.service.dispose();
});

test('disposal drains accepted operations and closes all session handles', async () => {
  const f = fixture({ stream: async function* ({ signal }) {
    await new Promise(resolve => { if (signal.aborted) resolve(); else signal.addEventListener('abort', resolve, { once: true }); });
  } });
  const thread = await open(f);
  const send = f.service.dispatch(request('send', { threadId: thread.id, text: 'Q', requestId: 'one' }));
  const disposal = f.service.dispose();
  await Promise.allSettled([send]); await disposal;
  assert.equal(f.service.pending.size, 0); assert.equal(f.service.operations.size, 0);
  assert.equal(f.service.activeRequests, 0); assert([...f.records.values()].every(record => record.closed));
  await assert.rejects(f.service.dispatch(request('config')), { code: 'DISPOSED' });
});

test('a failed mount releases its storage domain before rethrowing', async () => {
  const home = await mkdtemp(join(tmpdir(), 'btw-mount-failure-'));
  const { apply } = await import('../host.js');
  let closed = 0;
  const context = {
    dshHomePath: (...parts) => join(home, ...parts), sessionPersistence: {},
    storageDomain: { open: async () => ({ close: async () => { closed++; } }) },
    on: () => {}, provide: () => {}, effect: fn => fn(),
    connection: { register: () => { throw new Error('channel unavailable'); } },
  };
  try {
    await assert.rejects(apply(context), /channel unavailable/);
    assert.equal(closed, 1);
  } finally { await rm(home, { recursive: true, force: true }); }
});


test('thread model selection updates watchers and subsequent requests, not history or defaults', async () => {
  const f = fixture({ now:() => 1000 });
  try {
    const t = await open(f), main = clone(f.source), defaults = clone(f.domain.global.get());
    await f.service.dispatch(request('send', { threadId:t.id, text:'First', requestId:'one' })); await settled(f);
    const before = (await f.service.dispatch(request('get', { threadId:t.id }))).thread;
    const oldEvents = clone(f.records.get(t.id).events);
    const watch = f.service.dispatch(request('watch', { threadId:t.id, afterRevision:before.revision, timeoutMs:800 }));
    const settings = { mode:'fixed', provider:'p2', model:'m2' };
    const saved = await f.service.dispatch(request('config', { threadId:t.id, settings }));
    assert.deepEqual(saved.settings, settings);
    assert.deepEqual(saved.thread.model, { provider:'p2', model:'m2' });
    assert.deepEqual(saved.thread.messages, before.messages);
    assert(saved.thread.revision > before.revision);
    assert.deepEqual((await watch).thread.model, saved.thread.model);
    assert.deepEqual((await f.service.dispatch(request('config', { threadId:t.id }))).settings, settings);
    assert.deepEqual(f.domain.global.get(), defaults); assert.deepEqual(f.source, main);
    assert.deepEqual(f.records.get(t.id).events, oldEvents);
    assert.equal(f.calls(), 1, 'saving model settings must not call the model');
    await f.service.dispatch(request('send', { threadId:t.id, text:'Second', requestId:'two' })); await settled(f);
    assert.equal(f.requests[1].provider, 'p2'); assert.equal(f.requests[1].model, 'm2'); assert.deepEqual(f.requests[1].tools, []);
    assert.equal(f.requests[1].messages.filter(message => message.role === 'assistant').length, 1);
    const events = f.records.get(t.id).events;
    const change = events.find(event => event.type === 'request/header' && event.data.reason === 'change');
    assert(change); assert.deepEqual(change.data.header.config, saved.thread.model);
    assert.equal(events[events.indexOf(change)-1].type, 'step/start');
    assert.deepEqual(f.service.threads.get(t.id).session.requestHeader().config, saved.thread.model);
    f.source.events[1].data.message.source = { kind:'model', provider:'later-p', model:'later-m' };
    const follow = await f.service.dispatch(request('config', { threadId:t.id, settings:{ mode:'follow' } }));
    assert.deepEqual(follow.thread.model, t.model, 'follow uses frozen source attribution');
    assert.deepEqual(f.index.get(t.id).sourceModel, t.model);
  } finally { await f.service.dispose(); }
});

test('model selection rejects cross-source and running requests without publishing a change', async () => {
  const f = fixture({ stream:async function* ({ signal }) {
    await new Promise(resolve => { if (signal.aborted) resolve(); else signal.addEventListener('abort', resolve, { once:true }); });
  } });
  try {
    const t = await open(f), settings = { mode:'fixed', provider:'p2', model:'m2' };
    await assert.rejects(f.service.dispatch({ action:'config', sourceSessionId:'another-source', threadId:t.id, settings }));
    await f.service.dispatch(request('send', { threadId:t.id, text:'Wait', requestId:'busy' }));
    await assert.rejects(f.service.dispatch(request('config', { threadId:t.id, settings })), { code:'THREAD_BUSY' });
    assert.deepEqual((await f.service.dispatch(request('get', { threadId:t.id }))).thread.model, t.model);
  } finally { await f.service.dispose(); }
});

test('failed index persistence leaves the old selection visible and usable', async () => {
  const f = fixture();
  try {
    const t = await open(f), originalTable = f.domain.table;
    f.domain.table = name => ({ ...originalTable(name), put:async () => { throw new Error('index write failed'); } });
    await assert.rejects(f.service.dispatch(request('config', { threadId:t.id, settings:{ mode:'fixed', provider:'p2', model:'m2' } })), /index write failed/);
    const after = (await f.service.dispatch(request('get', { threadId:t.id }))).thread;
    assert.deepEqual(after.model, t.model); assert.equal(after.revision, t.revision);
    assert.deepEqual(f.index.get(t.id).model, t.model);
    f.domain.table = originalTable;
    await f.service.dispatch(request('send', { threadId:t.id, text:'Still old', requestId:'old' })); await settled(f);
    assert.equal(f.requests[0].model, t.model.model);
  } finally { await f.service.dispose(); }
});

test('legacy indexes without optional model fields can follow their source again', async () => {
  const f = fixture();
  try {
    await f.service.dispatch(request('config', { settings:{ mode:'fixed', provider:'old-p', model:'old-m' } }));
    const t = await open(f);
    delete f.service.threads.get(t.id).meta.sourceModel;
    delete f.service.threads.get(t.id).meta.modelSettings;
    const saved = await f.service.dispatch(request('config', { threadId:t.id, settings:{ mode:'follow' } }));
    assert.deepEqual(saved.thread.model, { provider:'provider-a', model:'model-a' });
    assert.deepEqual(f.domain.global.get(), { mode:'fixed', provider:'old-p', model:'old-m' });
  } finally { await f.service.dispose(); }
});

test('private provider closes only after threads and domain, including domain shutdown failure', async () => {
  let f, domainClosed = false, providerClosed = false;
  f = fixture({ disposePersistence: async () => {
    assert([...f.records.values()].every(record => record.closed));
    assert(domainClosed); providerClosed = true;
  } });
  await open(f);
  f.domain.close = async () => { domainClosed = true; throw new Error('Index close failure'); };
  await assert.rejects(f.service.dispose(), /storage shutdown failed/);
  assert(providerClosed, 'private provider must still be released when domain shutdown fails');
});
