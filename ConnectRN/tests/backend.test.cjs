const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const ts = require('typescript');
const { createClient } = require('@supabase/supabase-js');
// Compile the real pure adapter/API modules, avoiding native UI dependencies.
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'connect-api-test-'));
for (const name of ['utils/reservation', 'services/api']) {
  const output = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src', name + '.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const file = path.join(temp, name + '.js'); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, output);
}
after(() => fs.rmSync(temp, { recursive: true, force: true }));
const { serviceDate, minuteLabel, timeMinute, slotSelection, mapReservation, mapStore } = require(path.join(temp, 'utils/reservation.js'));
const { createBackend } = require(path.join(temp, 'services/api.js'));
const store = { id: 'store-1', owner_id: 'owner-1', name: '테스트 매장', region: '신촌', category: '한식', capacity: 40,
  opening_minute: 1020, closing_minute: 1470, allow_shared: true, approved: true, description: '', created_at: '' };

test('selected service dates preserve local calendar dates', () => {
  assert.equal(serviceDate(new Date(2026, 9, 13)), '2026-10-13');
});
test('cross-midnight slots preserve the service day', () => {
  assert.equal(minuteLabel(1440), '24:00'); assert.equal(timeMinute('24:30'), 1470);
  assert.deepEqual(slotSelection(['24:00', '23:30']), { p_start_minute: 1410, p_slot_count: 2 });
});
test('invalid, duplicate, disjoint and too-long selections fail before submission', () => {
  for (const labels of [[], ['18:00', '19:00'], ['18:00', '18:00'], ['18:01'], ['30:00'], ['xx:00'],
    ['18:00','18:30','19:00','19:30','20:00','20:30','21:00']]) assert.throws(() => slotSelection(labels));
});
test('database reservations round-trip service dates and overnight slots', () => {
  const mapped = mapReservation({ id: 'r', store_id: store.id, status: 'pending', people: 12, budget_per_person: null,
    service_date: '2026-10-13', start_minute: 1410, slot_count: 2, starts_at: '2026-10-13T14:30:00Z', ends_at: '2026-10-13T15:30:00Z',
    booker_name: '예약자', booker_affiliation: '학교', event_purpose: '', request_message: '', is_manual: false }, store.name);
  assert.equal(serviceDate(mapped.dateValue), '2026-10-13');
  assert.deepEqual(mapped.timeLabels, ['23:30', '24:00']);
  assert.equal(mapped.dateLabel, '10/13 23:30 ~ 24:30');
  assert.equal(mapped.budget, undefined); assert.equal(mapped.status, 'pending');
});
test('unmeasured store metrics never masquerade as real ratings', () => {
  const mapped = mapStore(store); assert.equal(mapped.metricsAvailable, false);
  assert.equal(mapped.maxCapacity, 40); assert.equal(mapped.closingMinute, 1470);
});
async function withApi(handler, action) {
  const server = http.createServer(async (req, res) => {
    let raw = ''; for await (const chunk of req) raw += chunk;
    const result = handler({ method: req.method, path: req.url, body: raw ? JSON.parse(raw) : null, headers: req.headers });
    res.writeHead(result.status ?? 200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(result.body));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const client = createClient(`http://127.0.0.1:${server.address().port}`, 'public-test-key', { auth: { persistSession: false, autoRefreshToken: false } });
  try { await action(createBackend(client)); } finally { await new Promise(resolve => server.close(resolve)); }
}
test('search sends the selected civil date, people and minute to PostgREST', async () => {
  let request;
  await withApi(req => { request = req; return { body: [store] }; }, async api => {
    const rows = await api.searchStores({ region: '신촌', date: new Date(2026, 9, 13), time: '19:30', people: 17 });
    assert.equal(rows[0].name, store.name);
  });
  assert.equal(request.path, '/rest/v1/rpc/search_stores'); assert.equal(request.method, 'POST');
  assert.deepEqual(request.body, { p_region: '신촌', p_service_date: '2026-10-13', p_start_minute: 1170, p_people: 17 });
});
test('unrestricted searches omit optional filters rather than sending invalid times', async () => {
  let body;
  await withApi(req => { body = req.body; return { body: [] }; }, async api => { assert.deepEqual(await api.searchStores(null), []); });
  assert.deepEqual(body, { p_people: 1 });
});
test('server conflicts are surfaced, never converted to successful local state', async () => {
  await withApi(() => ({ status: 409, body: { code: '23514', message: '잔여 좌석 부족', details: null, hint: null } }), async api => {
    await assert.rejects(api.rpc('decide_reservation', { p_reservation_id: 'r', p_accept: true }), e => e.code === '23514');
  });
});
test('the caller request UUID is preserved across a retry', async () => {
  const calls = [];
  await withApi(req => { calls.push(req.body); return { body: { id: 'same-reservation' } }; }, async api => {
    const args = { p_store_id: 's', p_service_date: '2026-10-13', p_start_minute: 1440, p_slot_count: 1, p_people: 10, p_request_id: 'same-request' };
    assert.deepEqual(await api.rpc('request_reservation', args), await api.rpc('request_reservation', args));
  });
  assert.equal(calls.length, 2); assert.equal(calls[0].p_request_id, calls[1].p_request_id);
});
