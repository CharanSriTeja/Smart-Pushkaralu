const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Ensure Metro only watches mobile directory
config.watchFolders = [__dirname];

// Prevent Metro from crawling or watching sibling backend, admin, and docs
config.resolver.blockList = [
  /[/\\]backend[/\\].*/,
  /[/\\]admin[/\\].*/,
  /[/\\]docs[/\\].*/,
];

module.exports = config;

