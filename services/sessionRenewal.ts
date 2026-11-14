import axios from 'axios';
import { config } from '../config';
import { normalizeApiError } from './apiError';
import firebaseAuthService from './firebaseAuthService';
import { tokenStore } from './tokenStore';

/**
 * Renew the api token from the Firebase session: ask Firebase for a fresh ID token and exchange it at
 * `POST /auth/firebase` (the same call as signing in).
 *
 * Single-flight: when several requests get a 401 at the same moment (a screen that loads three
 * things), they all wait for one renewal instead of each starting their own.
 *
 *   'renewed'  a new api token is stored; retry the request
 *   'expired'  there is no Firebase session to renew from, or Firebase or the api refused it: sign out
 *
 * It throws when renewal could not be tried at all (no connection, server error): that is a failure to
 * show with a retry, not a reason to sign the user out.
 */
export type RenewResult = 'renewed' | 'expired';

/** Firebase says the user can no longer sign in silently. */
const FIREBASE_SESSION_GONE = new Set([
  'auth/user-token-expired',
  'auth/invalid-user-token',
  'auth/user-disabled',
  'auth/user-not-found',
  'auth/requires-recent-login',
]);

let inflight: Promise<RenewResult> | null = null;

export function renewSession(): Promise<RenewResult> {
  if (!inflight) {
    inflight = renew().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

async function renew(): Promise<RenewResult> {
  const user = firebaseAuthService.getCurrentUser();
  if (!user) return 'expired';

  let idToken: string | null;
  try {
    idToken = await firebaseAuthService.getIdToken(true);
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code && FIREBASE_SESSION_GONE.has(code)) return 'expired';
    throw error;
  }
  if (!idToken) return 'expired';

  try {
    // A plain axios call: it must not go through the client that is asking for the renewal.
    const response = await axios.post<{ token?: string; userId?: string }>(
      `${config.API_BASE_URL}/auth/firebase`,
      { idToken, provider: firebaseAuthService.getSignInProvider(user) },
      { timeout: config.API_TIMEOUT }
    );
    if (!response.data?.token) return 'expired';
    await tokenStore.save(response.data.token, response.data.userId);
    return 'renewed';
  } catch (error) {
    const { kind, status } = normalizeApiError(error);
    if (kind === 'http' && (status === 401 || status === 403)) return 'expired';
    throw error;
  }
}
