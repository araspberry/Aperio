const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Bundle the offline scripture + commentary database as an asset.
config.resolver.assetExts.push("db");

module.exports = config;
