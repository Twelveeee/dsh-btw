import test from 'node:test';
import assert from 'node:assert/strict';
import { BtwModelDirectory } from '../client-model-directory.js';

const thread = () => ({ id:'btw-1', sourceSessionId:'source', revision:1, status:'idle', model:{ provider:'p', model:'old' },
  modelSettings:{ mode:'fixed', provider:'p', model:'old' }, sourceModel:{ provider:'p', model:'source-model' } });

function fixture(options = {}) {
  const requests = [], saved = [];
  const value = thread();
  const directory = new BtwModelDirectory({ sourceSessionId:'source', thread:value, followLabel:'Source answer', onSaved:value => saved.push(value),
    rpc:async (action, payload, signal) => {
      requests.push({ action, ...payload });
      if (action === 'models') {
        if (options.failProvider && payload.provider === 'broken') throw new Error('Catalog unavailable');
        return { models:[{ id:'old', name:'Old model' }, { id:'next', name:'Next model' }] };
      }
      assert.equal(payload.threadId, value.id); assert.equal(payload.sourceSessionId, 'source');
      if (!payload.settings) {
        if (options.load) return options.load(value);
        return { thread:structuredClone(value), settings:value.modelSettings, providers:[{ id:'p', name:'Provider' }, ...(options.failProvider ? [{ id:'broken' }] : [])] };
      }
      if (options.save) return options.save(payload.settings, value, signal);
      const settings = payload.settings;
      value.model = settings.mode === 'follow' ? { ...value.sourceModel } : { provider:settings.provider, model:settings.model };
      value.modelSettings = settings; value.revision++;
      return { settings, thread:structuredClone(value) };
    } });
  return { directory, requests, saved };
}

test('directory uses only source-bound BTW config and keeps usable catalogs when a provider fails', async () => {
  const f = fixture({ failProvider:true });
  await f.directory.load();
  const state = f.directory.getSnapshot();
  assert.equal(state.groups[0].models[0].name, 'Old model');
  assert.equal(state.failures[0].id, 'broken');
  assert.equal(state.current.model, 'old');
  assert(f.requests.every(request => ['config','models'].includes(request.action)));
  f.directory.dispose();
});

test('selection publishes only after the Host confirms the save and preserves a failure', async () => {
  let finish;
  const f = fixture({ save:settings => new Promise(resolve => { finish = () => resolve({ settings,
    thread:{ ...thread(), revision:2, model:{ provider:'p', model:'next' }, modelSettings:settings } }); }) });
  const selected = f.directory.select({ provider:'p', model:'next' });
  assert.equal(f.directory.getSnapshot().current.model, 'old');
  assert.equal(f.directory.getSnapshot().pending.model, 'next');
  assert.equal(f.saved.length, 0);
  finish(); assert.equal((await selected).ok, true);
  assert.equal(f.directory.getSnapshot().current.model, 'next'); assert.equal(f.saved.length, 1);
  f.directory.dispose();
  const failed = fixture({ save:async () => { throw new Error('Cannot persist'); } });
  assert.equal((await failed.directory.select({ provider:'p', model:'next' })).ok, false);
  assert.equal(failed.directory.getSnapshot().current.model, 'old'); assert.equal(failed.saved.length, 0);
  failed.directory.dispose();
});

test('follow entry resolves on the Host and never sends its synthetic UI route', async () => {
  const f = fixture();
  await f.directory.select({ provider:f.directory.followProvider, model:'source' });
  const save = f.requests.find(request => request.settings);
  assert.deepEqual(save.settings, { mode:'follow' });
  assert.equal(f.saved[0].model.model, 'source-model');
  assert.equal(f.directory.getSnapshot().current.provider, f.directory.followProvider);
  f.directory.dispose();
});

test('an old directory load cannot overwrite a later selection, and a running thread refuses it', async () => {
  let finish;
  const f = fixture({ load:value => new Promise(resolve => { const snapshot = structuredClone(value); finish = () => resolve({ thread:snapshot, settings:snapshot.modelSettings, providers:[{ id:'p' }] }); }) });
  const loading = f.directory.load();
  await f.directory.select({ provider:'p', model:'next' });
  finish(); await loading;
  assert.equal(f.directory.getSnapshot().current.model, 'next');
  f.directory.setThread({ ...f.saved[0], revision:3, status:'running' });
  const requestCount = f.requests.length;
  assert.equal((await f.directory.select({ provider:'p', model:'old' })).error.code, 'THREAD_BUSY');
  assert.equal(f.requests.length, requestCount);
  f.directory.dispose();
});
