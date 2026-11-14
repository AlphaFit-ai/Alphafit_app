/**
 * Jest module resolver. Reanimated 4.7 and Worklets 0.13 (Expo SDK 58) ship a Jest resolver that picks
 * their JavaScript implementation instead of the native one (there is no native runtime in Jest), and
 * the jest-expo preset already resolves through React Native's resolver. Both are kept: Reanimated's
 * (which also applies Worklets') runs first, with React Native's as its default resolver.
 */
const reanimatedResolver = require('react-native-reanimated/jest/resolver');
const presetResolver = require(require('jest-expo/jest-preset').resolver);

module.exports = (request, options) =>
  reanimatedResolver(request, {
    ...options,
    defaultResolver: (nextRequest, nextOptions) =>
      presetResolver(nextRequest, { ...nextOptions, defaultResolver: options.defaultResolver }),
  });
