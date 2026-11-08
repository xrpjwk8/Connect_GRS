#!/usr/bin/env python3
"""Collect UUID-matched vendor dSYMs for an iOS archive (never synthesize symbols)."""
import argparse
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tarfile
import tempfile

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.expo' / 'vendor-dsyms'


def uuids(path):
    result = subprocess.run(['xcrun', 'dwarfdump', '--uuid', str(path)], capture_output=True, text=True, check=True)
    return set(re.findall(r'UUID: ([0-9A-F-]+)', result.stdout))


def find_symbols(roots):
    for root in roots:
        if not root.exists():
            continue
        for directory, dirs, _ in os.walk(root):
            for name in list(dirs):
                if name.endswith('.dSYM'):
                    dirs.remove(name)
                    yield Path(directory) / name
            dirs[:] = [d for d in dirs if 'simulator' not in d and 'maccatalyst' not in d]


def fetch_symbols(name, version, url):
    destination = CACHE / f'{name}-{version}'
    if (destination / '.complete').exists():
        return destination
    CACHE.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=CACHE) as temporary:
        temporary = Path(temporary)
        archive = temporary / 'symbols.tar.gz'
        print(f'Downloading official {name} {version} symbols', flush=True)
        subprocess.run(['curl', '--fail', '--location', '--silent', '--show-error', '--retry', '2', url, '-o', str(archive)], check=True)
        extracted = temporary / 'extracted'
        extracted.mkdir()
        with tarfile.open(archive) as tar:
            # Only device dSYMs are needed; never extract paths outside this cache.
            members = [m for m in tar.getmembers() if 'simulator' not in m.name and 'maccatalyst' not in m.name]
            for member in members:
                target = (extracted / member.name).resolve()
                if extracted.resolve() not in target.parents and target != extracted.resolve():
                    raise ValueError('Unsafe archive path')
                if member.isdir():
                    target.mkdir(parents=True, exist_ok=True)
                elif member.isfile():
                    target.parent.mkdir(parents=True, exist_ok=True)
                    with tar.extractfile(member) as source, target.open('wb') as output:
                        shutil.copyfileobj(source, output)
        if destination.exists():
            shutil.rmtree(destination)
        shutil.move(str(extracted), str(destination))
        (destination / '.complete').touch()
    return destination


def collect(app, output):
    if not app.is_dir():
        raise SystemExit(f'App bundle does not exist: {app}')
    output.mkdir(parents=True, exist_ok=True)
    required = {}
    for framework in (app / 'Frameworks').glob('*.framework'):
        binary = framework / framework.stem
        if binary.exists():
            required[framework.stem] = uuids(binary)
    roots = [output, ROOT / 'ios/Pods', ROOT / 'node_modules/expo-image-manipulator/prebuilds', CACHE]

    def copy_matches():
        for symbol in find_symbols(roots):
            name = symbol.name.removesuffix('.framework.dSYM')
            expected = required.get(name)
            if expected and expected <= uuids(symbol):
                target = output / symbol.name
                if symbol.resolve() != target.resolve():
                    shutil.copytree(symbol, target, dirs_exist_ok=True)
                print(f'UUID matched: {name}', flush=True)
                del required[name]

    copy_matches()
    rn = json.loads((ROOT / 'node_modules/react-native/package.json').read_text())['version']
    lock = (ROOT / 'ios/Podfile.lock').read_text()
    hermes = re.search(r'^  - hermes-engine \(([^)]+)\)', lock, re.M)
    base = 'https://repo1.maven.org/maven2/com/facebook'
    downloads = {
        'React': ('react-core', rn, f'{base}/react/react-native-artifacts/{rn}/react-native-artifacts-{rn}-reactnative-core-dSYM-release.tar.gz'),
        'ReactNativeDependencies': ('react-deps', rn, f'{base}/react/react-native-artifacts/{rn}/react-native-artifacts-{rn}-reactnative-dependencies-dSYM-release.tar.gz'),
    }
    if hermes:
        version = hermes.group(1)
        downloads['hermesvm'] = ('hermes', version, f'{base}/hermes/hermes-ios/{version}/hermes-ios-{version}-hermes-framework-dSYM-release.tar.gz')
    for name in list(required):
        if name in downloads:
            fetch_symbols(*downloads[name])
    copy_matches()
    if required:
        raise SystemExit('Missing matching dSYMs: ' + ', '.join(sorted(required)))
    print('All embedded framework dSYMs verified.', flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--app', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    collect(args.app, args.output)
