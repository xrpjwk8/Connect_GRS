# iOS archive symbols

`plugins/withVendorSymbols.js` adds a Release archive phase after CocoaPods embeds
frameworks. After pod installation it also clears Expo configuration markers, so
restored debug XCFrameworks cannot be reused accidentally in a Release archive. It invokes `collect-ios-symbols.py` to copy genuine vendor dSYMs into
`DWARF_DSYM_FOLDER_PATH`, accepting only symbols whose UUIDs cover the embedded
binary's UUIDs. A missing/mismatched symbol fails the archive instead of hiding an
App Store upload warning.

Expo and SDWebImage symbols are located in the installed pods/prebuilds. React,
ReactNativeDependencies and Hermes release symbols come from their exact installed
versions on Meta's official Maven artifacts. Downloads are cached in ignored
`.expo/vendor-dsyms/`; a fresh cache needs network access, curl and Python 3.9+.
No credentials or dSYM binaries are committed.

Apply after changing the plugin:

```sh
npx expo prebuild --platform ios --no-clean --no-install
cd ios && pod install
```

Archive normally in Xcode. The phase logs `All embedded framework dSYMs verified.`
Symbols must match the archive; rebuilding a library cannot repair symbols for a
previously uploaded binary with another UUID.

To verify or repair an existing local archive:

```sh
python3 scripts/collect-ios-symbols.py \
  --app '/path/ConnectRN.xcarchive/Products/Applications/ConnectRN.app' \
  --output '/path/ConnectRN.xcarchive/dSYMs'
python3 scripts/test_ios_symbols.py
```

Validated 2026-11-08: 1.0.0 (2) Release archive contained UUID-matched dSYMs
for all 11 embedded frameworks. App Store Connect upload succeeded without
`Upload Symbols Failed` warnings. Unit checks cover matching, mismatched UUIDs,
repeat collection and missing app bundles. TestFlight build 1 was processed
with Missing Compliance; export-compliance responses are separate from symbols.
