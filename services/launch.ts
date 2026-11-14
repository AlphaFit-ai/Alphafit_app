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
 */
export async function runLaunchCheck(
  run: typeof bootstrapSession = bootstrapSession
): Promise<{ step: number } | null> {
  sessionStore.setLoading();
  const result = await run();
  switch (result.kind) {
    case 'unauthenticated':
      sessionStore.setSignedOut(false);
      return null;
    case 'signedOut':
      await signOut();
      return null;
    case 'retry':
      sessionStore.setLaunchError(result.reason);
      return null;
    case 'ready':
      sessionStore.setSignedIn(result);
      return { step: result.step };
  }
}
