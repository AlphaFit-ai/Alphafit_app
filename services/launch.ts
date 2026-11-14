import { configureApiAuth } from './apiClient';
import { bootstrapSession } from './bootstrap';
import { signOut } from './session';
import { sessionStore } from './sessionStore';

/**
 * Connect the api client to the session: when a token cannot be renewed the user is signed out, and
 * the route guards take them to login.
 */
export function connectSessionToApi(): void {
  configureApiAuth({ onSessionExpired: () => void signOut() });
}

/**
 * Run the launch check and put the result in the session store. Safe to call again (retry).
 * Returns the onboarding step to show in the progress state, or null.
 *
 * Only the first check (and "Try again" after it failed) shows the launch screen. Once the session is
 * known, a later check runs in the background: going back to 'loading' would unmount the navigator,
 * throw its history away (Android back then had nothing to pop and closed the app) and flip the route
 * guards. A background check that cannot reach the api leaves the session as it is.
 */
export async function runLaunchCheck(
  run: typeof bootstrapSession = bootstrapSession
): Promise<{ step: number } | null> {
  const first = sessionStore.getState().status === 'loading';
  if (first) sessionStore.setLoading();
  const result = await run();
  switch (result.kind) {
    case 'unauthenticated':
      sessionStore.setSignedOut(false);
      return null;
    case 'signedOut':
      await signOut();
      return null;
    case 'retry':
      if (first) sessionStore.setLaunchError(result.reason);
      return null;
    case 'ready':
      sessionStore.setSignedIn(result);
      return { step: result.step };
  }
}
