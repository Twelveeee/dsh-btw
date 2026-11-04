import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { Readable, Writable } from 'node:stream';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import plugin from '../host.js';

const runtime = createRequire(process.env.BTW_DSH_PACKAGE_JSON ?? import.meta.url);
const { Context } = await import(runtime.resolve('@deepseek-ai/cordis'));
const { HostConnectionService } = await import(runtime.resolve('@deepseek-ai/dsh-client-connection'));

// Both services must belong to plugin fibers. Root-provided fixtures conceal
// the provider-shadowed context captured by Connection.rpc's getter in rc.2.
test('scoped Connection mounts authenticated BTW HTTP and cleans routes/storage on reload', async () => {
  const home = await mkdtemp(join(tmpdir(), 'btw-connection-'));
  const root = new Context();
  const routes = new Map();
  let authorized = false, opened = 0, closed = 0;
  const dependencies = root.plugin({
    name: 'btw-test-dependencies',
    apply(ctx) {
      ctx.provide('credentials', {});
      ctx.provide('webServer', {
        host: '127.0.0.1', protocol: 'http:',
        register(route) {
          assert(!routes.has(route.path), 'duplicate route');
          routes.set(route.path, route);
          return () => routes.delete(route.path);
        },
      });
      ctx.provide('llm', { listProviders: () => [] });
      ctx.provide('sessionQuery', {});
      ctx.provide('sessionPersistence', {});
      ctx.provide('dshHomePath', (...parts) => join(home, ...parts));
      ctx.provide('storageDomain', { open: async () => {
        opened++;
        return { global: { get: () => ({ mode: 'follow' }) }, close: async () => { closed++; } };
      } });
      ctx.provide('tools', { register: () => {} });
    },
  });
  await dependencies.await();
  let providerContext;
  const provider = root.plugin({
    name: 'btw-test-connection', inject: ['credentials'],
    apply(ctx) {
      providerContext = ctx;
      new HostConnectionService(ctx, [], {
        isAuthenticated: () => authorized,
        authenticateApi: () => undefined,
      });
    },
  });
  await provider.await();
  assert.throws(() => providerContext.webServer, /without inject/);
  assert.equal(root.fiber.store.webServer, undefined);
  const fiber = root.plugin(plugin);
  async function post(body, origin = 'http://127.0.0.1:3080') {
    const text = JSON.stringify(body);
    const request = Readable.from([Buffer.from(text)]);
    Object.assign(request, {
      method: 'POST', url: '/btw-rpc/dsh-btw/dispatch',
      headers: { host: '127.0.0.1:3080', origin, 'content-type': 'application/json', 'content-length': String(Buffer.byteLength(text)) },
      socket: { encrypted: false },
    });
    const chunks = [];
    let status;
    const response = new Writable({ write(chunk, encoding, done) { chunks.push(Buffer.from(chunk)); done(); } });
    response.writeHead = code => { status = code; return response; };
    await routes.get('/btw-rpc').handler(request, response);
    return { status, text: Buffer.concat(chunks).toString() };
  }
  try {
    await fiber.await();
    assert.equal(routes.size, 1);
    const request = { type: 'client-request', rpcId: 'btw-scope-test', method: 'dsh-btw/dispatch', payload: { action: 'config' } };
    assert.equal((await post(request)).status, 401);
    authorized = true;
    assert.equal((await post(request, 'https://untrusted.example')).status, 403);
    const result = await post(request);
    assert.equal(result.status, 200);
    assert.deepEqual(JSON.parse(result.text), {
      type: 'server-response', rpcId: 'btw-scope-test',
      result: { ok: true, value: { settings: { mode: 'follow' }, providers: [] } },
    });
    await fiber.restart();
    assert.equal(opened, 2);
    assert.equal(closed, 1);
    assert.equal(routes.size, 1);
    assert.equal((await post(request)).status, 200);
    await fiber.dispose();
    assert.equal(closed, 2);
    assert.equal(routes.size, 0);
    assert.equal(provider.state, 2, 'BTW must not dispose the shared Connection');
  } finally { await root.fiber.dispose(); await rm(home, { recursive: true, force: true }); }
});
