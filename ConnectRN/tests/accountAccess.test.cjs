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

function renderSignup(session, values = {}, development = true, role = 'booker', signup = true, account = {}) {
  let stateIndex = 0;
  const stateNames = ["useEmailAuth", "email", "code", "sentTo", "cooldown", "requestingCode", "name", "school", "department", "position", "agreed", "actionBusy", "error"];
  const box = ({ children }) => React.createElement('div', null, children);
  const button = ({ title, disabled, loading }) => React.createElement('button', { disabled, ...(loading ? { 'aria-busy': true } : {}) }, title);
  const dependencies = {
    '../navigation/useNativeBack': { __esModule: true, default: () => () => {} },
    react: { ...React, useState(initial) { const key = stateNames[stateIndex++]; return React.useState(key in values ? values[key] : initial); } },
    'react-native': { KeyboardAvoidingView: box, ScrollView: box, Text: box, View: box, Platform: { OS: 'web' } },
    'react-native-safe-area-context': { SafeAreaView: box },
    '../state/AppState': { useAppState: () => ({ session, ready: true, profile: null, ...account }), useTypography: () => ({}) },
    '../lib/supabase': { supabase: {} },
    '../services/backend': {},
    './CommonComponents': { AppTextField: ({ placeholder, secureTextEntry }) => React.createElement('input', { placeholder, type: secureTextEntry ? 'password' : 'text' }), FormLabel: ({ title, required }) => title + (required ? '*' : '') },
    './ScreenHeader': { __esModule: true, default: ({ title }) => title },
    '../theme/spacing': { AppSpacing: {} },
    '../theme/radius': { AppRadius: {} },
    './Buttons': { LimeButton: button, GhostButton: button },
    './AgreementSection': { __esModule: true, default: () => '필수 약관' },
    '../theme/colors': { AppColors: {} },
  };
  const sandbox = { exports: {}, __DEV__: development, require: name => {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
    return dependencies[name];
  } };
  vm.runInNewContext(compiled, sandbox);
  return renderToStaticMarkup(React.createElement(sandbox.exports.default, { role, signup }));
}

test('verified user remount resumes profile completion, never development preview', () => {
  const html = renderSignup({ user: { email: 'booker@example.com' } });
  assert.match(html, /이메일 인증 완료/);
  assert.match(html, /가입 완료하고 학생증 제출하기/);
  assert.doesNotMatch(html, /테스트 미리보기|테스트 미리보기로 돌아가기|인증번호 요청/);
});

test('OTP session waits for profile before showing signup terms for either role or entry path', () => {
  const session = { user: { email: 'existing@example.com' } };
  for (const role of ['booker', 'owner']) for (const signup of [false, true]) {
    for (const account of [{ ready: false }, { ready: true, profile: { role } }]) {
      const html = renderSignup(session, {}, false, role, signup, account);
      assert.match(html, /인증된 계정을 확인하고 있습니다/);
      assert.doesNotMatch(html, /필수 약관|기본 정보|가입 정보 확인|가입 완료|<input|<button/);
    }
    const incomplete = renderSignup(session, {}, false, role, signup, { ready: true, profile: null });
    assert.match(incomplete, /필수 약관/);
    assert.match(incomplete, /가입 완료/);
  }
});

test('unauthenticated development signup still offers blank preview and real authentication separately', () => {
  const html = renderSignup(null);
  assert.match(html, /입력 없이 테스트 미리보기/);
  assert.match(html, /이메일 인증하기/);
  assert.doesNotMatch(html, /이메일 인증 완료|가입 완료하고 학생증 제출하기/);
});

test('booker completion requires group and position while preview remains available', () => {
  const session = { user: { email: 'booker@example.com' } };
  const complete = { name: '홍길동', school: '연세대학교', department: '학생회', position: '총무', agreed: true };
  for (const field of ['name', 'school', 'department', 'position']) {
    assert.match(renderSignup(session, { ...complete, [field]: '   ' }), /<button disabled="">가입 완료하고 학생증 제출하기/);
  }
  assert.match(renderSignup(session, complete), /<button>가입 완료하고 학생증 제출하기/);
  const preview = renderSignup(null);
  assert.match(preview, /<button>입력 없이 테스트 미리보기/);
  for (const label of ['이름', '학교명', '학과 / 집단명', '직책', '이메일']) assert.ok(preview.includes(label + '*'));
  assert.doesNotMatch(preview, /\(필수\)|\(선택\)/);
  assert.equal((preview.match(/placeholder="[^"]+"/g) || []).length, 5);
});

test('authentication request keeps continue disabled with its normal label', () => {
  const html = renderSignup(null, { useEmailAuth: true, actionBusy: true, email: 'booker@example.com', sentTo: 'booker@example.com', code: '123456' });
  assert.match(html, /<button disabled="">인증하고 계속<\/button>/);
  assert.doesNotMatch(html, /처리 중/);
});

test('release signup never exposes development preview or its return button', () => {
  for (const useEmailAuth of [true, false]) {
    const html = renderSignup(null, { useEmailAuth }, false);
    assert.doesNotMatch(html, /테스트 미리보기|개발용|실제 가입/);
    assert.match(html, /인증번호 요청/);
    assert.match(html, /인증하고 계속/);
  }
});


test('both roles show loading only during OTP request, not cooldown, in login and signup', () => {
  for (const role of ['booker', 'owner']) {
    for (const signup of [false, true]) {
      const render = values => renderSignup(null, { email: 'test@example.com', ...values }, false, role, signup);
      assert.match(render({ requestingCode: true, actionBusy: true }), /<button disabled="" aria-busy="true">인증번호 요청 중…<\/button>/);
      for (const cooldown of [60, 42, 1]) {
        const html = render({ cooldown });
        assert.ok(html.includes(`<button disabled="">${cooldown}초 후 재요청</button>`));
        assert.doesNotMatch(html, /aria-busy="true"/);
      }
      assert.match(render({}), /<button>인증번호 요청<\/button>/);
    }
  }
});


test('both roles log in only with email verification codes', () => {
  for (const role of ['booker', 'owner']) {
    const html = renderSignup(null, {}, false, role, false);
    assert.match(html, /인증번호 요청/);
    assert.match(html, /인증하고 계속/);
    assert.doesNotMatch(html, /비밀번호|type="password"|테스트 미리보기/);
  }
});
