import { onboardingQuery } from '../hooks/queries';
import { ApiErrorKind, logError, normalizeApiError } from './apiError';
import firebaseAuthService, { AuthProviderName } from './firebaseAuthService';
import { resolveOnboardingResume } from './onboardingResume';
import onboardingService, { OnboardingData } from './onboardingService';
import { queryClient } from './queryClient';
import { queryKeys } from './queryKeys';
import userService, { UserProfile } from './userService';

/** How long the launch check waits before the retry screen appears (the client default is 30 s). */
const LAUNCH_REQUEST_TIMEOUT_MS = 10_000;

export type BootstrapResult =
  /** Nobody is signed in. Show the intro and login. */
  | { kind: 'unauthenticated' }
  /** The session cannot be used any more. Sign out, then show the login screen. */
  | { kind: 'signedOut' }
  /** Signed in; `route` is where to continue. */
  | { kind: 'ready'; data: OnboardingData | null; route: string; step: number; complete: boolean }
  /** The check failed and may work later. Show a retry. Nothing was changed. */
  | { kind: 'retry'; reason: ApiErrorKind };

export interface BootstrapDeps {
  /** Resolves after Firebase restored its persisted session; false when nobody is signed in. */
  waitForAuth(): Promise<boolean>;
  fetchOnboarding(): Promise<OnboardingData | null>;
}

export const defaultBootstrapDeps: BootstrapDeps = {
  async waitForAuth() {
    return !!(await firebaseAuthService.waitForAuthReady());
  },
  fetchOnboarding: () =>
    queryClient.fetchQuery({
      ...onboardingQuery,
      staleTime: 0,
      // Never wait for a connection here: offline must end in the retry screen, not on the logo.
      networkMode: 'always',
      queryFn: () => onboardingService.getOnboardingData({ timeout: LAUNCH_REQUEST_TIMEOUT_MS }),
      retry: false,
    }),
};

/**
 * The launch check: who is signed in and where do they continue?
 *
 *  - waits for Firebase to restore the saved session before looking at it
 *  - asks the api for the user's onboarding answers (the api client renews an expired token by itself:
 *    a 401 that reaches this point means the session could not be renewed)
 *  - a failed request is a `retry`, never "new user": nothing is changed and the caller shows a retry
 */
export async function bootstrapSession(
  deps: BootstrapDeps = defaultBootstrapDeps
): Promise<BootstrapResult> {
  let signedIn: boolean;
  try {
    signedIn = await deps.waitForAuth();
  } catch (error) {
    logError('bootstrap.auth', error);
    return { kind: 'retry', reason: normalizeApiError(error).kind };
  }
  if (!signedIn) return { kind: 'unauthenticated' };

  let data: OnboardingData | null;
  try {
    data = await deps.fetchOnboarding();
  } catch (error) {
    const outcome = resolveOnboardingResume({ error });
    if (outcome.kind === 'signOut') return { kind: 'signedOut' };
    if (outcome.kind === 'retry') return { kind: 'retry', reason: outcome.reason };
    return { kind: 'retry', reason: 'unknown' };
  }
  const outcome = resolveOnboardingResume({ data });
  if (outcome.kind !== 'route') return { kind: 'retry', reason: 'unknown' };
  return {
    kind: 'ready',
    data,
    route: outcome.route,
    step: outcome.step,
    complete: outcome.complete,
  };
}

export interface SignInResult {
  data: OnboardingData | null;
  route: string;
  step: number;
  complete: boolean;
  profile?: UserProfile;
}

/**
 * What every sign-in does once an api token is stored: read the user's onboarding answers, decide
 * where they continue, and put the answers (and the profile, when the sign-in returned one) into the
 * query cache. Throws when the request fails; a failure is never treated as "no onboarding data".
 */
export async function resumeAfterSignIn(profile?: UserProfile): Promise<SignInResult> {
  const data = await onboardingService.getOnboardingData();
  const outcome = resolveOnboardingResume({ data });
  if (outcome.kind !== 'route') throw new Error('Unexpected resume outcome');
  queryClient.setQueryData(queryKeys.onboarding, data);
  if (profile) queryClient.setQueryData(queryKeys.profile, profile);
  return {
    data,
    route: outcome.route,
    step: outcome.step,
    complete: outcome.complete,
    profile,
  };
}

/**
 * Finish a sign-in (Google, Apple, email or a new registration): exchange the Firebase ID token for
 * an api token, then read the user's onboarding answers to decide where they continue. The answers
 * and the profile go into the query cache.
 *
 * It throws when either request fails. The login and registration screens show the error with a
 * retry; they never treat the failure as "no onboarding data".
 */
export async function completeSignIn(
  idToken: string,
  provider: AuthProviderName
): Promise<SignInResult> {
  const auth = await userService.authenticateUser(idToken, provider);
  return resumeAfterSignIn(auth.user);
}
