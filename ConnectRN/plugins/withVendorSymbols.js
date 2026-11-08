const { withXcodeProject, withPodfile } = require('expo/config-plugins');

// Precompiled frameworks ship symbols separately. Archive them only when UUIDs match.
module.exports = function withVendorSymbols(config) {
  config = withPodfile(config, config => {
    const marker = '# Connect vendor dSYMs: run after CocoaPods embed phases';
    const hook = `${marker}
post_integrate do |installer|
  # pod install can restore debug XCFrameworks while leaving release markers behind.
  # Force Expo's next build-phase switch to select the requested configuration again.
  Dir.glob(File.join(installer.sandbox.root.to_s, '*', 'artifacts', '*.last_config')).concat(Dir.glob(File.join(installer.sandbox.root.to_s, '*', 'artifacts', '.last_build_configuration'))).each do |marker|
    File.delete(marker)
  end
  installer.aggregate_targets.map(&:user_project).uniq.each do |project|
    project.native_targets.each do |target|
      phase = target.shell_script_build_phases.find { |p| p.name == '[Connect] Collect vendor dSYMs' }
      if phase
        target.build_phases.delete(phase)
        target.build_phases << phase
      end
    end
    project.save
  end
end
`;
    config.modResults.contents = config.modResults.contents.includes(marker)
      ? config.modResults.contents.replace(/# Connect vendor dSYMs: run after CocoaPods embed phases[\s\S]*?^end\n?/m, hook)
      : config.modResults.contents + '\n' + hook;
    return config;
  });
  return withXcodeProject(config, config => {
    const project = config.modResults;
    const name = '[Connect] Collect vendor dSYMs';
    const phases = (project.hash.project.objects.PBXShellScriptBuildPhase || {});
    if (!Object.values(phases).some(phase => phase && phase.name === `"${name}"`)) {
      project.addBuildPhase([], 'PBXShellScriptBuildPhase', name, project.getFirstTarget().uuid, {
        shellPath: '/bin/sh',
        shellScript: 'set -eu\nif [ "$ACTION" = "install" ] && [ "$CONFIGURATION" = "Release" ]; then\n  python3 "$SRCROOT/../scripts/collect-ios-symbols.py" --app "$TARGET_BUILD_DIR/$FULL_PRODUCT_NAME" --output "$DWARF_DSYM_FOLDER_PATH"\nfi',
      });
    }
    return config;
  });
};
