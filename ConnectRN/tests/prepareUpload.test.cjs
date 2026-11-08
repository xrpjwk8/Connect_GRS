const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(name, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, '../src/utils/', name + '.ts'), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const sandbox = { exports: {}, ...globals }; vm.runInNewContext(output, sandbox); return sandbox.exports;
}
const jpeg = size => { const b = new Uint8Array(size); b.set([255,216,255]); return b.buffer; };
function fixture({ original = jpeg(3000000), width = 4000, height = 3000, sizes = [500000], fail = false } = {}) {
  const calls = []; let index = 0;
  const rendered = { width, height, release() {}, async saveAsync(options) { calls.push(options); return { uri: 'encoded' }; } };
  const context = { async renderAsync() { if (fail) throw Error('decode failed'); return rendered; }, resize(size) { calls.push(size); }, release() {} };
  const { prepareUpload } = load('prepareUpload', {
    require: name => name === 'expo-image-manipulator' ? { ImageManipulator: { manipulate: () => context }, SaveFormat: { JPEG: 'jpeg' } } : load('studentVerification'),
    fetch: async uri => ({ arrayBuffer: async () => uri === 'original' ? original : jpeg(sizes[Math.min(index++, sizes.length - 1)]) }),
  });
  return { run: (purpose, size) => prepareUpload({ uri: 'original', name: 'card.png', size }, purpose), calls };
}
test('student preview and upload use resized JPEG with accurate metadata', async () => {
  const f = fixture(); const result = await f.run('student');
  assert.equal(result.uri, 'encoded'); assert.equal(result.name, 'card.jpg');
  assert.equal(result.mimeType, 'image/jpeg'); assert.equal(result.size, 500000);
  assert.equal(f.calls[0].width, 2000);
});
test('portrait photos preserve aspect ratio and retry to meet 1MB limit', async () => {
  const f = fixture({ width: 3000, height: 4000, sizes: [1500000, 800000] });
  assert.equal((await f.run('photo')).size, 800000);
  assert.equal(f.calls[0].height, 1600); assert.equal(f.calls[2].compress, 0.72);
});
test('small JPEG is not enlarged or upscaled', async () => {
  const f = fixture({ original: jpeg(5000), width: 200, height: 100 });
  assert.equal((await f.run('student')).uri, 'original'); assert.equal(f.calls.length, 1);
});
test('PDF passes through and retains its 10MB limit', async () => {
  const pdf = new TextEncoder().encode('%PDF-1.7').buffer;
  const f = fixture({ original: pdf });
  assert.equal((await f.run('student')).mimeType, 'application/pdf'); assert.equal(f.calls.length, 0);
  const oversized = new Uint8Array(11 * 1024 * 1024); oversized.set(new Uint8Array(pdf));
  await assert.rejects(fixture({ original: oversized.buffer }).run('student'), /10MB/);
});
test('uncompressible and corrupt images fail instead of sending originals', async () => {
  await assert.rejects(fixture({ sizes: [2500000] }).run('student'), /용량/);
  await assert.rejects(fixture({ fail: true }).run('student'), /decode/);
});
test('empty and excessive source files fail before encoding', async () => {
  await assert.rejects(fixture({ original: new ArrayBuffer(0) }).run('student'), /10MB/);
  await assert.rejects(fixture({ original: new ArrayBuffer(10 * 1024 * 1024 + 1) }).run('student'), /10MB/);
});

test('10MB source boundary is accepted but larger metadata or actual bytes are rejected', async () => {
  const limit = 10 * 1024 * 1024;
  const accepted = fixture({ original: jpeg(limit) });
  assert.equal((await accepted.run('student', limit)).uri, 'encoded');
  const metadata = fixture();
  await assert.rejects(metadata.run('student', limit + 1), /10MB/);
  assert.equal(metadata.calls.length, 0);
  const actual = fixture({ original: jpeg(limit + 1) });
  await assert.rejects(actual.run('student', 1024), /10MB/);
  assert.equal(actual.calls.length, 0);
});
