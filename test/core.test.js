import test from 'node:test';
import assert from 'node:assert/strict';
import { captureContext, contextText, chooseModel, validateRequest, validateSettings, threadKey, questionId, normaliseChoices, KeyedMutex, foldThread } from '../core.js';

const user = (id, text, kind = 'user') => ({ type: 'user/message', data: { id, role: 'user', source: { kind }, content: [{ type: 'text', text }] } });
const assistant = (id, text) => ({ type: 'assistant/message', data: { message: { id, role: 'assistant', source: { kind: 'model', provider: 'source-p', model: 'source-m' }, content: [{ type: 'reasoning', text: 'SECRET_THOUGHT' }, { type: 'text', text }] } } });
const fixture = () => [
  { type: 'system/message', data: { message: { content: [{ type: 'text', text: 'SECRET_SYSTEM' }] } } },
  user('injected', 'SECRET_INJECTION', 'plugin'), user('u1', 'Question'),
  { type: 'tool/result', data: { message: { content: [{ type: 'text', text: 'SECRET_TOOL' }] } } },
  assistant('a1', 'Answer'), user('u2', 'SECRET_LATER'), assistant('a2', 'SECRET_FUTURE_ANSWER'),
].map((e, seq) => ({ ...e, seq }));

test('snapshot is inclusive at exact assistant id and excludes hidden/later data', () => {
  const events = fixture(), before = JSON.stringify(events);
  const snapshot = captureContext(events, 'a1');
  assert.deepEqual(snapshot.messages, [{ role: 'user', text: 'Question' }, { role: 'assistant', text: 'Answer' }]);
  assert.equal(snapshot.seq, 4); assert.equal(snapshot.chars, 14);
  assert.equal(contextText(snapshot).includes('SECRET'), false);
  assert.equal(JSON.stringify(events), before);
  assert.throws(() => captureContext(events, 'u1'), { code: 'MESSAGE_NOT_FOUND' });
});

test('follow uses exact selected source model, explicit model never changes source', () => {
  const snapshot = captureContext(fixture(), 'a1');
  assert.deepEqual(chooseModel({ mode: 'follow' }, snapshot), { provider: 'source-p', model: 'source-m' });
  assert.deepEqual(chooseModel({ mode: 'fixed', provider: 'p2', model: 'm2' }, snapshot), { provider: 'p2', model: 'm2' });
  assert.deepEqual(snapshot.model, { provider: 'source-p', model: 'source-m' });
  assert.throws(() => chooseModel({ mode: 'follow' }, { model: null }), { code: 'SOURCE_MODEL_UNAVAILABLE' });
});

test('strict action-specific validation, bounded polling and text', () => {
  const base = { sourceSessionId: 's' };
  assert.equal(validateRequest({ ...base, action: 'watch', threadId: 't', afterRevision: 0 }).timeoutMs, 20000);
  for (const invalid of [null, [], {}, { ...base, action: '__proto__' }, { ...base, action: 'get', threadId: 't', extra: true },
    { ...base, action: 'watch', threadId: 't', afterRevision: 0, timeoutMs: 0 }, { ...base, action: 'watch', threadId: 't', afterRevision: NaN },
    { ...base, action: 'send', threadId: 't', text: ' ', requestId: 'r' }, { ...base, action: 'send', threadId: 't', text: 'q' },
    { ...base, action: 'send', threadId: 't', text: 'q'.repeat(32001), requestId: 'r' },
  ]) assert.throws(() => validateRequest(invalid), { code: 'INVALID_REQUEST' });
  assert.throws(() => validateSettings({ mode: 'fixed', provider: 'p' }), { code: 'INVALID_REQUEST' });
  assert.throws(() => validateSettings({ mode: 'follow', provider: 'p' }), { code: 'INVALID_REQUEST' });
});

test('global settings operations omit sourceSessionId but validate it when supplied', () => {
  assert.deepEqual(validateRequest({ action: 'config' }), { action: 'config' });
  assert.deepEqual(validateRequest({ action: 'models', provider: 'p' }), { action: 'models', provider: 'p' });
  for (const action of ['config', 'models']) {
    for (const sourceSessionId of ['', null, 42, undefined]) {
      assert.throws(() => validateRequest({ action, ...(action === 'models' ? { provider: 'p' } : {}), sourceSessionId }), { code: 'INVALID_REQUEST' });
    }
  }
  for (const action of ['open', 'get', 'send', 'stop', 'watch']) assert.throws(() => validateRequest({ action }), { code: 'INVALID_REQUEST' });
});

test('stable identities, normalized model directory, and independent lock keys', async () => {
  assert.equal(threadKey('s', 'm'), threadKey('s', 'm')); assert.notEqual(threadKey('s', 'm'), threadKey('s2', 'm'));
  assert.notEqual(questionId('a'), questionId('b'));
  assert.deepEqual(normaliseChoices(['p', { id: 'm', name: 'Model' }]), [{ id: 'p' }, { id: 'm', name: 'Model' }]);
  const mutex = new KeyedMutex(); const order = []; let release;
  const one = mutex.run('one', async () => { order.push(1); await new Promise(r => { release = r; }); order.push(2); });
  const two = mutex.run('one', () => order.push(3));
  await mutex.run('two', () => order.push(4));
  assert.deepEqual(order, [1, 4]); release(); await Promise.all([one, two]);
  assert.deepEqual(order, [1, 4, 2, 3]); assert.equal(mutex.tails.size, 0);
});


test('targeted model settings require a valid thread and its source session', () => {
  const input = { action:'config', sourceSessionId:'s', threadId:'t', settings:{ mode:'fixed', provider:'p2', model:'m2' } };
  assert.deepEqual(validateRequest(input), input);
  assert.throws(() => validateRequest({ ...input, sourceSessionId:undefined }), { code:'INVALID_REQUEST' });
  for (const threadId of ['', null, 42, undefined]) assert.throws(() => validateRequest({ ...input, threadId }), { code:'INVALID_REQUEST' });
});

test('reply metrics use durable provider tokens and the native first-token reader', async () => {
  const runtime = await import('@deepseek-ai/dsh-llm');
  const stream = new runtime.AssistantStreamAccumulator();
  stream.push({ time:1100, chunk:{ type:'reasoning-delta', index:0, text:'Thinking' } });
  stream.push({ time:1500, chunk:{ type:'text-delta', index:1, text:'Answer' } });
  stream.push({ time:2000, chunk:{ type:'finish', reason:{ kind:'stop' } } });
  const event = { ...assistant('a', 'Answer'), time:2100 };
  event.data.usage = { inputTokens:20, outputTokens:40 };
  event.data.stream = stream.snapshot();
  const events = [{ type:'step/start', time:1000, data:{} }, event];
  const answer = foldThread(events, 'context', runtime).messages[0];
  assert.deepEqual(answer.usage, event.data.usage);
  assert.deepEqual(answer.metrics, { durationMs:1100, firstTokenMs:100, tokensPerSecond:40 });
  delete event.data.usage;
  assert.equal(foldThread(events, 'context', runtime).messages[0].metrics.tokensPerSecond, undefined);
  delete event.data.stream;
  assert.deepEqual(foldThread(events, 'context', runtime).messages[0].metrics, { durationMs:1100 });
});

test('discussion activity excludes frozen setup and counts accepted turns and failed steps', () => {
  const events = [
    { type:'turn/start', data:{ turn:1 }, time:100 },
    { type:'step/start', data:{ turn:1, step:1 }, time:100 },
    { ...user('context', 'Frozen reference', 'dsh-btw'), time:100 },
    { type:'step/end', data:{ turn:1, step:1 }, time:100 },
    { type:'turn/end', data:{ turn:1, reason:{ kind:'completed' } }, time:100 },
    { type:'turn/start', data:{ turn:2 }, time:200 }, user('q', 'Question'),
    { type:'step/start', data:{ turn:2, step:1 }, time:200 },
    { type:'assistant/attempt', data:{ turn:2, step:1 }, time:250 },
    { type:'step/end', data:{ turn:2, step:1 }, time:250 },
    { type:'turn/end', data:{ turn:2, reason:{ kind:'error', error:{ message:'failed' } } }, time:250 },
  ];
  assert.deepEqual(foldThread(events, 'context').statistics, { turns:1, steps:1, updatedAt:250 });
});
