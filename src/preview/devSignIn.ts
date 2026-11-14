import * as firebaseAuth from 'firebase/auth';
import { logError, normalizeApiError } from '../../services/apiError';
import { resumeAfterSignIn, SignInResult } from '../../services/bootstrap';
import { signOut } from '../../services/session';
import { sessionStore } from '../../services/sessionStore';
import { tokenStore } from '../../services/tokenStore';
import { checkDevToken } from './devToken';

/**
 * Dev-only sign-in of the browser preview (docs/CONTRACTS.md section 8): the owner opens
 * `/dev-sign-in#token=<JWT>` with a token signed for the local stack, instead of going through
 * Firebase, which a browser preview does not have.
 *
 * After the token is stored it follows the same path as a real sign-in: the previous session is
 * cleared with the one `signOut()` (token, query cache, per-user stores), the token and the user id
 * go into the token store, the onboarding answers are read from the api (`resumeAfterSignIn`, which
 * also proves the api accepts the token), and the session store is told where the user continues.
 *
 * It refuses to do anything in a build that was not made with `EXPO_PUBLIC_PREVIEW=1`; such a build
 * does not even contain this module (the route file loads it behind that flag).
 */
export type DevSignInFailure =
  | 'disabled'
  | 'missing'
  | 'malformed'
  | 'expired'
  /** The api refused the token (wrong secret, unknown user, expired). */
  | 'rejected'
  /** The api could not be reached. */
  | 'offline'
  | 'failed';

export class DevSignInError extends Error {
  reason: DevSignInFailure;

  constructor(reason: DevSignInFailure) {
    super(`dev sign-in: ${reason}`);
    this.name = 'DevSignInError';
    this.reason = reason;
  }
}

export const isPreviewBuild = (): boolean => process.env.EXPO_PUBLIC_PREVIEW === '1';

/** Tells the stand-in for Firebase (tools/preview/stubs/firebase-auth.js) who is signed in. */
function setPreviewUser(user: { uid: string; email: string | null } | null): void {
  const hook = (firebaseAuth as unknown as { __previewSetUser?: (u: typeof user) => void })
    .__previewSetUser;
  hook?.(user);
}

export async function signInWithDevToken(token: string | null): Promise<SignInResult> {
  if (!isPreviewBuild()) throw new DevSignInError('disabled');

  const check = checkDevToken(token);
  if (!check.ok) throw new DevSignInError(check.reason);

  // Whoever was signed in before is signed out completely first, as on a phone.
  await signOut();

  try {
    await tokenStore.save(check.token, check.claims.userId);
    setPreviewUser({ uid: check.claims.userId, email: check.claims.email });
    const result = await resumeAfterSignIn();
    sessionStore.setSignedIn(result);
    return result;
  } catch (error) {
    // Leave nothing behind: a token the api refused must not stay in the store.
    await signOut();
    const { kind, status } = normalizeApiError(error);
    if (kind === 'http' && (status === 401 || status === 403 || status === 404)) {
      throw new DevSignInError('rejected');
    }
    if (kind === 'offline' || kind === 'timeout') throw new DevSignInError('offline');
    logError('preview.devSignIn', error);
    throw new DevSignInError('failed');
  }
}
