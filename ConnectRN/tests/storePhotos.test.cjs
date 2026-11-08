const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function compile(file, require, extra = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src', file + '.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const sandbox = { exports: {}, require, ...extra }; vm.runInNewContext(code, sandbox); return sandbox.exports;
}
const jpeg = size => { const b = new Uint8Array(size); b.set([255,216,255]); return b.buffer; };
function fixture({ bytes = jpeg(100), preview = false, account = 'owner', uploadError, rpcError, cleanupError } = {}) {
  const calls = [];
  const storage = {
    upload: async (key, body, options) => { calls.push(['upload', key, body.byteLength, options.contentType]); return { error: uploadError }; },
    remove: async keys => { calls.push(['remove', ...keys]); return { error: cleanupError }; },
  };
  const mod = compile('services/storePhotos', name => {
    if (name === 'expo-crypto') return { randomUUID: () => 'request' };
    if (name === '../lib/supabase') return { supabase: { auth: { getSession: async () => ({ data: { session: { user: { id: account } } } }) }, storage: { from: () => storage } } };
    if (name === '../lib/developmentPreview') return { developmentPreview: { active: preview }, previewRestriction: 'preview' };
    if (name === '../utils/studentVerification') return compile('utils/studentVerification');
    if (name === './backend') return { rpc: async (name, args) => { calls.push(['rpc', name, args.p_path]); if (rpcError) throw rpcError; return 'store/old.jpg'; } };
    throw Error(name);
  }, { fetch: async () => ({ arrayBuffer: async () => bytes }) });
  return { calls, save: () => mod.saveStorePhoto('store', 'owner', { uri: 'prepared', name: 'photo.jpg' }), remove: () => mod.saveStorePhoto('store', 'owner', null) };
}
test('uploads compressed bytes before linking and cleans previous photo afterwards', async () => {
  const f = fixture(); const result = await f.save();
  assert.equal(result.path, 'store/request.jpg');
  assert.deepEqual(f.calls.map(c => c[0]), ['upload', 'rpc', 'remove']);
  assert.equal(f.calls[0][2], 100); assert.equal(f.calls[0][3], 'image/jpeg');
  assert.equal(f.calls[2][1], 'store/old.jpg');
});
test('preview, account changes, PDFs and oversized files never write', async () => {
  for (const config of [{ preview: true }, { account: 'other' }, { bytes: jpeg(1048577) }, { bytes: new TextEncoder().encode('%PDF-1.7').buffer }]) {
    const f = fixture(config); await assert.rejects(f.save()); assert.equal(f.calls.length, 0);
  }
});
test('failed linking only attempts cleanup of new object, never old photo', async () => {
  const f = fixture({ rpcError: Error('offline') }); await assert.rejects(f.save(), /offline/);
  assert.equal(f.calls[2][1], 'store/request.jpg');
});
test('unlink happens before deletion; cleanup failure does not hide committed result', async () => {
  const f = fixture({ cleanupError: Error('offline') });
  assert.equal((await f.remove()).cleanupPending, true);
  assert.deepEqual(f.calls.map(c => c[0]), ['rpc', 'remove']); assert.equal(f.calls[0][2], null);
});
