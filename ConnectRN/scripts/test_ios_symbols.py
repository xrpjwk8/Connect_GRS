import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('symbols', Path(__file__).with_name('collect-ios-symbols.py'))
symbols = importlib.util.module_from_spec(spec)
spec.loader.exec_module(symbols)


class SymbolCollectionTests(unittest.TestCase):
    def setup_tree(self, root):
        app = root / 'App.app'
        framework = app / 'Frameworks/Vendor.framework'
        framework.mkdir(parents=True)
        (framework / 'Vendor').touch()
        (root / 'ios').mkdir()
        (root / 'ios/Podfile.lock').write_text('')
        (root / 'node_modules/react-native').mkdir(parents=True)
        (root / 'node_modules/react-native/package.json').write_text('{"version":"0.86.3"}')
        symbol = root / 'ios/Pods/Vendor.framework.dSYM'
        symbol.mkdir(parents=True)
        (symbol / 'debug-info').write_text('real-symbol-placeholder')
        return app, symbol

    def test_matching_symbols_are_copied_and_repeat_is_safe(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            app, symbol = self.setup_tree(root)
            with patch.object(symbols, 'ROOT', root), patch.object(symbols, 'CACHE', root / 'cache'), patch.object(symbols, 'uuids', return_value={'MATCH'}):
                symbols.collect(app, root / 'out')
                symbols.collect(app, root / 'out')
            self.assertEqual((root / 'out' / symbol.name / 'debug-info').read_text(), 'real-symbol-placeholder')

    def test_wrong_uuid_is_rejected_not_uploaded(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            app, symbol = self.setup_tree(root)
            with patch.object(symbols, 'ROOT', root), patch.object(symbols, 'CACHE', root / 'cache'), patch.object(symbols, 'uuids', side_effect=lambda p: {'WRONG'} if p.suffix == '.dSYM' else {'RIGHT'}):
                with self.assertRaisesRegex(SystemExit, 'Missing matching dSYMs: Vendor'):
                    symbols.collect(app, root / 'out')
            self.assertFalse((root / 'out' / symbol.name).exists())

    def test_missing_app_is_not_reported_as_success(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaisesRegex(SystemExit, 'App bundle does not exist'):
                symbols.collect(Path(tmp) / 'missing.app', Path(tmp) / 'out')


if __name__ == '__main__':
    unittest.main()
