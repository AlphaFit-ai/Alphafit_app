import { logError } from './apiError';
import firebaseAuthService from './firebaseAuthService';
import { clearStoredTheme } from './preferences';
import { clearQueryCache } from './queryClient';
import { sessionStore } from './sessionStore';
import { tokenStore } from './tokenStore';

/**
 * The signed-in session: the one `signOut()` and the registry that lets every store forget its data.
 *
 * Every way out of the app goes through `signOut()`: the Logout button, "Delete account" after the
 * api has deactivated it, a launch that finds the session invalid, and any request whose token can
 * no longer be renewed. After it resolves a second person signing in on the same phone sees none of
 * the first person's data.
 */

type SessionResetter = () => void | Promise<void>;

const resetters = new Set<SessionResetter>();
let epoch = 0;

/** Stores that hold per-user UI state register a reset function here when they mount. */
export function registerSessionResetter(resetter: SessionResetter): () => void {
  resetters.add(resetter);
  return () => {
    resetters.delete(resetter);
  };
}

/** Identifies the current session. It changes every time someone signs out. */
export function getSessionEpoch(): number {
  return epoch;
}

/** Async work that writes into a store captures the epoch first and drops its result if it changed. */
export function isSessionCurrent(capturedEpoch: number): boolean {
  return capturedEpoch === epoch;
}

/**
 * Sign out:
 *  0. the session store says `signedOut`, so the route guards take the user to login at once and no
 *     screen keeps asking the api
 *  1. the api token and user id are removed
 *  2. the query cache (profile, onboarding, diet, projection, scans, avatar) is cancelled, emptied and
 *     removed from the device, then every registered store is reset
 *  3. the saved theme is removed (the language is a device preference and stays)
 *  4. the Firebase session and the Google session end
 *
 * Each step runs even if an earlier one fails; failures are logged without personal data. Never throws.
 */
export async function signOut(): Promise<void> {
  epoch += 1;
  sessionStore.setSignedOut(true);

  const attempt = async (name: string, work: () => void | Promise<void>) => {
    try {
      await work();
    } catch (error) {
      logError(`signOut.${name}`, error);
    }
  };

  await attempt('token', () => tokenStore.clear());
  await attempt('cache', () => clearQueryCache());
  for (const resetter of [...resetters]) {
    await attempt('reset', resetter);
  }
  await attempt('theme', () => clearStoredTheme());
  await attempt('providers', () => firebaseAuthService.signOutProviders());
}
