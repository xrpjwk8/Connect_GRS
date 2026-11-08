const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const source = fs.readFileSync(path.join(__dirname, '../src/components/AccountAccess.tsx'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  jsx: ts.JsxEmit.React, esModuleInterop: true,
} }).outputText;

function renderSignup(session) {
  const box = ({ children }) => React.createElement('div', null, children);
  const button = ({ title, disabled }) => React.createElement('button', { disabled }, title);
  const dependencies = {
    react: React,
    'react-native': { KeyboardAvoidingView: box, ScrollView: box, Text: box, View: box, Platform: { OS: 'web' } },
    'react-native-safe-area-context': { SafeAreaView: box },
    '../state/AppState': { useAppState: () => ({ session, ready: true }), useTypography: () => ({}) },
    '../lib/supabase': { supabase: {} },
    '../services/backend': {},
    './CommonComponents': { AppTextField: () => React.createElement('input'), FormLabel: ({ title }) => title },
    './ScreenHeader': { __esModule: true, default: ({ title }) => title },
    '../theme/spacing': { AppSpacing: {} },
    '../theme/radius': { AppRadius: {} },
    './Buttons': { LimeButton: button, GhostButton: button },
    './AgreementSection': { __esModule: true, default: () => '필수 약관' },
    '../theme/colors': { AppColors: {} },
  };
  const sandbox = { exports: {}, __DEV__: true, require: name => {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
    return dependencies[name];
  } };
  vm.runInNewContext(compiled, sandbox);
  return renderToStaticMarkup(React.createElement(sandbox.exports.default, { role: 'booker', signup: true }));
}

test('verified user remount resumes profile completion, never development preview', () => {
  const html = renderSignup({ user: { email: 'booker@example.com' } });
  assert.match(html, /이메일 인증 완료/);
  assert.match(html, /가입 완료하고 학생증 제출하기/);
  assert.doesNotMatch(html, /테스트 미리보기|테스트 미리보기로 돌아가기|인증번호 요청/);
});

test('unauthenticated development signup still offers blank preview and real authentication separately', () => {
  const html = renderSignup(null);
  assert.match(html, /입력 없이 테스트 미리보기/);
  assert.match(html, /이메일 인증하기 \(실제 가입\)/);
  assert.doesNotMatch(html, /이메일 인증 완료|가입 완료하고 학생증 제출하기/);
});
