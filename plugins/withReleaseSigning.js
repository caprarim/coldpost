const { withAppBuildGradle } = require('expo/config-plugins');

const PROP = 'COLDPOST_STORE_FILE';

const releaseConfig = `
        release {
            if (project.hasProperty('${PROP}')) {
                storeFile file(project.property('${PROP}'))
                storePassword project.property('COLDPOST_STORE_PASSWORD')
                keyAlias project.property('COLDPOST_KEY_ALIAS')
                keyPassword project.property('COLDPOST_KEY_PASSWORD')
            }
        }`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    let gradle = mod.modResults.contents;
    if (gradle.includes(PROP)) return mod;
    gradle = gradle.replace(
      /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/,
      `$1signingConfig project.hasProperty('${PROP}') ? signingConfigs.release : signingConfigs.debug`,
    );
    gradle = gradle.replace(/signingConfigs\s*\{/, (match) => `${match}${releaseConfig}`);
    mod.modResults.contents = gradle;
    return mod;
  });
};
