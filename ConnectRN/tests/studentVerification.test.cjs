const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../src/utils/studentVerification.ts'), 'utf8');
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const sandbox = { exports: {} }; vm.runInNewContext(output, sandbox);
const { studentCardFormat, MAX_STUDENT_CARD_BYTES } = sandbox.exports;
test('student card content determines JPEG, PNG and PDF upload types', () => {
  assert.equal(studentCardFormat(Uint8Array.from([255,216,255,224]).buffer).contentType, 'image/jpeg');
  assert.equal(studentCardFormat(Uint8Array.from([137,80,78,71,13,10,26,10]).buffer).extension, 'png');
  assert.equal(studentCardFormat(new TextEncoder().encode('%PDF-1.7').buffer).contentType, 'application/pdf');
});
test('renamed HTML and incomplete signatures cannot be uploaded as student cards', () => {
  for (const value of [new TextEncoder().encode('<html>fake.jpg</html>').buffer, Uint8Array.from([255,216]).buffer]) {
    assert.throws(() => studentCardFormat(value), /JPG, PNG/);
  }
});
test('empty and oversized student documents are rejected before upload', () => {
  assert.throws(() => studentCardFormat(new ArrayBuffer(0)), /10MB/);
  assert.throws(() => studentCardFormat(new ArrayBuffer(MAX_STUDENT_CARD_BYTES + 1)), /10MB/);
});
