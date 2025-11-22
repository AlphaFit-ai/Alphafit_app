const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Resolve async module for web compatibility
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Exclude react-native-country-picker-modal on web
  if (platform === 'web' && moduleName === 'react-native-country-picker-modal') {
    return {
      type: 'empty',
    };
  }
  
  // Exclude react-async-hook on web (used by country picker)
  if (platform === 'web' && moduleName === 'react-async-hook') {
    return {
      type: 'empty',
    };
  }

  // Use default resolution for all other modules
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
