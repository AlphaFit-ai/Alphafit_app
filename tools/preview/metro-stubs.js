const path = require('path');

/**
 * Dev-only web preview (tools/preview): when `EXPO_PUBLIC_PREVIEW=1` and the platform is web, native-only
 * modules are replaced by stubs so the screens can be rendered in a browser. EAS builds never set the
 * variable and never build for web, so this changes nothing for the apps.
 */
const STUBS = {
  '@react-native-google-signin/google-signin': 'google-signin.js',
  'expo-apple-authentication': 'apple-authentication.js',
  'expo-camera': 'camera.js',
  'expo-secure-store': 'secure-store.js',
  'expo-haptics': 'haptics.js',
  'firebase/auth': 'firebase-auth.js',
};

function withPreviewStubs(config, env = process.env) {
  if (env.EXPO_PUBLIC_PREVIEW !== '1') return config;
  const stubDir = path.join(__dirname, 'stubs');
  const upstream = config.resolver.resolveRequest;
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (platform === 'web' && STUBS[moduleName]) {
      return { type: 'sourceFile', filePath: path.join(stubDir, STUBS[moduleName]) };
    }
    return (upstream || context.resolveRequest)(context, moduleName, platform);
  };
  return config;
}

module.exports = { withPreviewStubs, STUBS };
