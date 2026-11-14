import { useSyncExternalStore } from 'react';
import type { ApiErrorKind } from './apiError';

/**
 * Where the app is in the sign-in lifecycle. The route guards (`Stack.Protected` in the layouts) read
 * this and nothing else, so who may see which screen is decided in one place.
 *
 *   loading     the launch check is running
 *   signedOut   nobody is signed in: intro, login, register
 *   onboarding  signed in, onboarding not finished: the question screens
 *   ready       signed in and onboarded: the app
 *
 * `launchError` is set when the launch check failed in a way that may pass later (no connection,
 * timeout, server error). The root layout then shows a retry instead of any screen.
 */
export type SessionStatus = 'loading' | 'signedOut' | 'onboarding' | 'ready';

export interface SessionState {
  status: SessionStatus;
  /** Where an `onboarding` user continues (a route of the question screens). */
  resumeRoute: string | null;
  launchError: ApiErrorKind | null;
  /** True after a sign-out, so the next screen is login instead of the intro. */
  afterSignOut: boolean;
}

const initial: SessionState = {
  status: 'loading',
  resumeRoute: null,
  launchError: null,
  afterSignOut: false,
};
let state: SessionState = initial;
const listeners = new Set<() => void>();

function set(next: Partial<SessionState>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

export const sessionStore = {
  getState: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  setLoading: () => set({ status: 'loading', launchError: null }),
  setLaunchError: (kind: ApiErrorKind) => set({ status: 'loading', launchError: kind }),
  setSignedOut: (afterSignOut = false) =>
    set({ status: 'signedOut', resumeRoute: null, launchError: null, afterSignOut }),
  setOnboarding: (resumeRoute: string) =>
    set({ status: 'onboarding', resumeRoute, launchError: null }),
  setReady: () =>
    set({ status: 'ready', resumeRoute: null, launchError: null, afterSignOut: false }),
  /** A completed sign-in or launch check: onboarding or the app, depending on the saved answers. */
  setSignedIn: (r: { complete: boolean; route: string }) =>
    r.complete ? sessionStore.setReady() : sessionStore.setOnboarding(r.route),
  /** Test helper. */
  reset: () => set({ ...initial }),
};

export function useSession(): SessionState {
  return useSyncExternalStore(sessionStore.subscribe, sessionStore.getState);
}

/** The route `/` sends the user to for the current state. */
export function entryRoute(s: SessionState): string {
  switch (s.status) {
    case 'ready':
      return '/(tabs)/home';
    case 'onboarding':
      return s.resumeRoute ?? '/onboarding/source';
    default:
      return s.afterSignOut ? '/onboarding/login' : '/onboarding/intro';
  }
}
