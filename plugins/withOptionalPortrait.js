
const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withOptionalPortrait(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    const features = manifest["uses-feature"] || [];

    const portrait = features.find(
      (feature) =>
        feature.$["android:name"] ===
        "android.hardware.screen.portrait"
    );

    if (portrait) {
      portrait.$["android:required"] = "false";
    } else {
      features.push({
        $: {
          "android:name": "android.hardware.screen.portrait",
          "android:required": "false"
        }
      });
    }

    manifest["uses-feature"] = features;

    return config;
  });
};
