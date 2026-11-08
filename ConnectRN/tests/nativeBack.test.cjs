const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
function load(file, dependencies = {}) {
  const sandbox = { exports: {}, require: name => dependencies[name] };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/navigation/', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, sandbox);
  return sandbox.exports;
}
test('cancelled or repeated native transitions never trigger logout; committed removal triggers once', () => {
  const { createRemovalObserver } = load('removedRoute.ts');
  for (const name of ['Account', 'AdminReview']) {
    let calls = 0;
    const listener = createRemovalObserver(name, () => calls++);
    const emit = names => listener({ data: { state: { routes: names.map(name => ({ name })) } } });
    emit(['Main']);
    emit(['Main', name]);
    emit(['Main', name]); // Cancelled gesture leaves the route intact.
    assert.equal(calls, 0);
    emit(['Main']); emit(['Main']);
    assert.equal(calls, 1);
    emit(['Main', name]); emit(['Main']);
    assert.equal(calls, 2);
  }
});
test('busy native screens disable gestures and prevent removal; button shares native goBack', () => {
  for (const busy of [false, true]) {
    let options, prevent, pops = 0;
    const { default: useNativeBack } = load('useNativeBack.ts', {
      react: { useLayoutEffect: effect => effect() },
      'react-native': { useWindowDimensions: () => ({ width: 440 }) },
      '@react-navigation/native': {
        useNavigation: () => ({ setOptions: value => { options = value; }, goBack: () => pops++ }),
        usePreventRemove: value => { prevent = value; },
      },
    });
    useNativeBack(busy)();
    assert.equal(options.gestureEnabled, !busy);
    assert.equal(options.fullScreenGestureEnabled, true);
    assert.equal(options.gestureResponseDistance.start, 0);
    assert.equal(options.gestureResponseDistance.end, 220);
    assert.equal(prevent, busy);
    assert.equal(pops, busy ? 0 : 1);
  }
});
