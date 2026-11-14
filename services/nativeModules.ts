import type { GoogleSignin as GoogleSigninModule } from '@react-native-google-signin/google-signin';
import { isRunningInExpoGo } from 'expo';
import { TurboModuleRegistry } from 'react-native';
import { config } from '../config';
import { logError } from './apiError';

/**
 * Native modules that are not in every app binary.
 *
 * Expo Go (the store app, used to try the app on a phone without a build) ships a fixed set of native
 * modules. For SDK 58 every Expo module this app uses is in it, and so are reanimated, worklets,
 * gesture-handler, screens, safe-area-context, netinfo, async-storage and keyboard-controller. Google
 * sign-in is not (it needs its own native code and a development build): its package asks for the
 * native module the moment it is imported (`TurboModuleRegistry.getEnforcing`) and throws, which
 * crashed the app at start. It is therefore loaded here, on demand, only when its native module is
 * present, and never in Expo Go.
 */

/**
 * True inside the Expo Go app. Expo's own test: the `ExpoGo` native module exists. (Expo Go 58 does
 * not report `executionEnvironment` "storeClient", which this used to check, so it is not used.)
 */
export function isExpoGo(): boolean {
  return isRunningInExpoGo();
}

/** Whether this binary has a native module, asked without throwing (New Architecture only, SDK 55+). */
function hasNativeModule(name: string): boolean {
  return TurboModuleRegistry.get(name) != null;
}

type GoogleSignin = typeof GoogleSigninModule;
let google: GoogleSignin | null | undefined;

/**
 * The configured Google sign-in module, or null when this binary has none (Expo Go, or a build made
 * without it): an expected state, so nothing is logged. Loaded and configured once, on first use; a
 * failure while loading a module that is there is logged.
 */
export function getGoogleSignin(): GoogleSignin | null {
  if (google !== undefined) return google;
  google = null;
  if (isExpoGo() || !hasNativeModule('RNGoogleSignin')) return google;
  try {
    // A require, not an import: importing the package is what throws when the native module is missing.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const loaded = require('@react-native-google-signin/google-signin') as {
      GoogleSignin: GoogleSignin;
    };
    loaded.GoogleSignin.configure({
      webClientId: config.googleAuth.webClientId,
      offlineAccess: true,
      // Force account selection on first sign-in, then remember the account
      forceCodeForRefreshToken: true,
    });
    google = loaded.GoogleSignin;
  } catch (error) {
    logError('nativeModules.googleSignin', error);
  }
  return google;
}

/** Test hook: forget what was loaded, so a test can load the module again in another setting. */
export function _resetNativeModules(): void {
  google = undefined;
}
