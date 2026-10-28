const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow bundling compressed offline bird audio files (.opus, .ogg, .mp3, .wav)
for (const ext of ['opus', 'ogg', 'mp3', 'wav']) {
  if (!config.resolver.assetExts.includes(ext)) {
    config.resolver.assetExts.push(ext);
  }
}

module.exports = config;

