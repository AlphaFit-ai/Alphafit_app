const { getDefaultConfig } = require('expo/metro-config');
const { withPreviewStubs } = require('./tools/preview/metro-stubs');

// withPreviewStubs changes nothing unless EXPO_PUBLIC_PREVIEW=1 (the dev-only web preview, tools/preview).
module.exports = withPreviewStubs(getDefaultConfig(__dirname));
