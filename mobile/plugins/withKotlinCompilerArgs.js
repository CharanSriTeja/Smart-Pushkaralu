const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withKotlinCompilerArgs(config) {
  return withProjectBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.contents.includes('-Xskip-metadata-version-check')) {
      return modConfig;
    }
    const snippet = `
allprojects {
  tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
    kotlinOptions {
      freeCompilerArgs += ["-Xskip-metadata-version-check"]
    }
  }
}
`;
    modConfig.modResults.contents += snippet;
    return modConfig;
  });
};

