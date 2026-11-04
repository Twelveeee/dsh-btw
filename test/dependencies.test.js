import test from 'node:test';
import assert from 'node:assert/strict';
import { inject } from '../host.js';

test('custom Connection RPC channels declare the caller webServer dependency', () => {
  assert(inject.includes('connection'));
  assert(inject.includes('webServer'), 'Connection.rpc.handle accesses the calling fiber webServer; omitting inject prevents the route from mounting');
});
