const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const source = fs.readFileSync(path.join(__dirname, '../src/screens/Booker/StudentVerificationScreen.tsx'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React, esModuleInterop: true,
} }).outputText;
function renderScreen(isPreview, status = 'draft', selected = null) {
  let stateIndex = 0;
  const states = [selected, true, false, false];
  const box = ({ children }) => React.createElement('div', null, children);
  const button = ({ title, disabled }) => React.createElement('button', { disabled }, title);
  const forbidden = () => { throw new Error('Rendering must never write or upload'); };
  const dependencies = {
    react: { ...React, useState: () => [states[stateIndex++], () => {}] },
    'react-native': { Image: box, ScrollView: box, Switch: () => React.createElement('input', { type: 'checkbox' }), Text: box, View: box },
    'react-native-safe-area-context': { SafeAreaView: box },
    '@react-navigation/native': { useNavigation: () => ({}) },
    'expo-document-picker': { getDocumentAsync: forbidden },
    '../../state/AppState': { useAppState: () => ({ isPreview, session: { user: { id: 'existing-user' } }, studentVerification: { status } }), useTypography: () => ({}) },
    '../../components/Buttons': { GhostButton: button, LimeButton: button },
    '../../components/StudentDocumentPreview': { __esModule: true, default: () => '제출 문서' },
    '../../components/ScreenHeader': { __esModule: true, default: ({ title }) => title },
    '../../components/DataStatus': { __esModule: true, default: () => null },
    '../../theme/spacing': { AppSpacing: {} }, '../../theme/radius': { AppRadius: {} }, '../../theme/colors': { AppColors: {} },
    '../../hooks/useServer': { useRefreshOnFocus() {}, useServerAction: () => ({ busy: false, run: forbidden }) },
    '../../utils/studentVerification': { MAX_STUDENT_CARD_BYTES: 10485760, verificationLabel: {} },
    '../../utils/prepareUpload': { prepareUpload: forbidden },
    '../../services/studentVerification': { uploadStudentCard: forbidden },
    '../../services/backend': { rpc: forbidden }, '../../utils/alert': {},
  };
  const sandbox = { exports: {}, require: name => {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
    return dependencies[name];
  } };
  vm.runInNewContext(compiled, sandbox);
  return renderToStaticMarkup(React.createElement(sandbox.exports.default));
}
test('local document preview exposes picking but no consent, upload or retry even with a session', () => {
  const html = renderScreen(true, 'draft', { name: 'local-test.png', uri: 'file:///local-test.png', mimeType: 'image/png', size: 1000 });
  assert.match(html, /다른 파일로 교체/);
  assert.match(html, /local-test.png/);
  assert.match(html, /선택한 파일 제거/);
  assert.doesNotMatch(html, /type="checkbox"|학생증 제출하기|제출 재시도|제출 문서/);
});
test('real draft keeps consent and disabled submit; pending and approved cannot pick or submit', () => {
  const draft = renderScreen(false);
  assert.match(draft, /type="checkbox"/);
  assert.match(draft, /<button disabled="">학생증 제출하기<\/button>/);
  for (const status of ['pending', 'approved']) {
    assert.doesNotMatch(renderScreen(false, status), /학생증 파일 선택|학생증 제출하기|type="checkbox"/);
  }
});
