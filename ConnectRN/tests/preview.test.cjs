const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { createClient } = require('@supabase/supabase-js');

const source = fs.readFileSync(path.join(__dirname, '../src/lib/developmentPreview.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const sandbox = { exports: {}, __DEV__: true, URL, Response };
vm.runInNewContext(compiled, sandbox);
const { createPreviewBoundary } = sandbox.exports;

function clientFor(boundary, requests) {
  return createClient('https://example.supabase.co', 'public-test-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: boundary.wrapFetch(async (...args) => {
      requests.push(args); return new Response('[]', { headers: { 'Content-Type': 'application/json' } });
    }) },
  });
}

test('preview searches use local examples without contacting Supabase', async () => {
  const boundary = createPreviewBoundary(true); boundary.enter();
  const requests = []; const client = clientFor(boundary, requests);
  const { data, error } = await client.rpc('search_stores', { p_region: '신촌', p_people: 20 });
  assert.equal(error, null); assert.equal(data[0].id, 'preview-store');
  const slots = await client.rpc('get_availability', { p_store_id: data[0].id, p_service_date: '2026-10-13' });
  assert.equal(slots.error, null); assert.equal(slots.data.length, 15);
  const empty = await client.rpc('search_stores', { p_region: '건대', p_people: 20 });
  assert.equal(empty.data.length, 0); assert.equal(requests.length, 0);
});

test('preview denies reservation RPCs, direct writes, Auth and unknown endpoints', async () => {
  const boundary = createPreviewBoundary(true); boundary.enter();
  const requests = []; const client = clientFor(boundary, requests);
  const reservation = await client.rpc('request_reservation', { p_store_id: 'preview-store' });
  assert.ok(reservation.error); assert.equal(reservation.data, null);
  const favorite = await client.from('favorites').insert({ store_id: 'preview-store', user_id: 'existing-user' });
  assert.ok(favorite.error);
  const guarded = boundary.wrapFetch(async () => { requests.push('unexpected'); return new Response('{}'); });
  for (const endpoint of ['/auth/v1/otp', '/storage/v1/object/cards/a', '/rest/v1/rpc/future_write']) {
    await assert.rejects(guarded('https://example.supabase.co' + endpoint, { method: 'POST' }), /테스트 미리보기/);
  }
  assert.equal(requests.length, 0);
});

test('leaving preview restores real requests and production cannot enter preview', async () => {
  const boundary = createPreviewBoundary(true); const requests = []; const client = clientFor(boundary, requests);
  boundary.enter(); boundary.exit();
  assert.equal(boundary.active, false);
  await client.rpc('search_stores', {}); assert.equal(requests.length, 1);
  const production = createPreviewBoundary(false);
  assert.throws(() => production.enter(), /개발 빌드/); assert.equal(production.active, false);
  await clientFor(production, requests).rpc('search_stores', {}); assert.equal(requests.length, 2);
});
