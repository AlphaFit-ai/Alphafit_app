import { runLaunchCheck } from '../services/launch';
import { signOut } from '../services/session';
import { entryRoute, sessionStore } from '../services/sessionStore';

const firebaseAuth = jest.requireMock('firebase/auth');

describe('session store', () => {
  it('starts loading', () => {
    expect(sessionStore.getState().status).toBe('loading');
  });

  it('sends each state to the right place from /', () => {
    const s = sessionStore.getState();
    expect(entryRoute({ ...s, status: 'ready' })).toBe('/(tabs)/home');
    expect(entryRoute({ ...s, status: 'onboarding', resumeRoute: '/onboarding/age' })).toBe(
      '/onboarding/age'
    );
    expect(entryRoute({ ...s, status: 'onboarding', resumeRoute: null })).toBe(
      '/onboarding/source'
    );
    expect(entryRoute({ ...s, status: 'signedOut', afterSignOut: false })).toBe(
      '/onboarding/intro'
    );
    expect(entryRoute({ ...s, status: 'signedOut', afterSignOut: true })).toBe('/onboarding/login');
  });

  it('setSignedIn picks onboarding or the app from the saved answers', () => {
    sessionStore.setSignedIn({ complete: false, route: '/onboarding/gender' });
    expect(sessionStore.getState()).toMatchObject({
      status: 'onboarding',
      resumeRoute: '/onboarding/gender',
    });
    sessionStore.setSignedIn({ complete: true, route: '/(tabs)/home' });
    expect(sessionStore.getState()).toMatchObject({ status: 'ready', resumeRoute: null });
  });

  it('notifies subscribers until they unsubscribe', () => {
    const listener = jest.fn();
    const off = sessionStore.subscribe(listener);
    sessionStore.setReady();
    off();
    sessionStore.setSignedOut();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('launch check', () => {
  const answer = (r: unknown) => jest.fn().mockResolvedValue(r);

  it('maps every outcome to a state', async () => {
    await runLaunchCheck(answer({ kind: 'unauthenticated' }));
    expect(sessionStore.getState()).toMatchObject({ status: 'signedOut', afterSignOut: false });

    await runLaunchCheck(
      answer({ kind: 'ready', data: null, route: '/onboarding/age', step: 1, complete: false })
    );
    expect(sessionStore.getState()).toMatchObject({
      status: 'onboarding',
      resumeRoute: '/onboarding/age',
    });

    await runLaunchCheck(
      answer({ kind: 'ready', data: {}, route: '/(tabs)/home', step: 9, complete: true })
    );
    expect(sessionStore.getState().status).toBe('ready');
  });

  it('keeps showing the launch screen with the reason when the check failed', async () => {
    await runLaunchCheck(answer({ kind: 'retry', reason: 'offline' }));
    expect(sessionStore.getState()).toMatchObject({ status: 'loading', launchError: 'offline' });
  });

  it('clears the error while it tries again', async () => {
    await runLaunchCheck(answer({ kind: 'retry', reason: 'timeout' }));
    let seen: unknown = 'not run';
    await runLaunchCheck(
      jest.fn(async () => {
        seen = sessionStore.getState().launchError;
        return { kind: 'unauthenticated' } as const;
      })
    );
    expect(seen).toBeNull();
  });

  it('signs out when the session is gone', async () => {
    sessionStore.setReady();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await runLaunchCheck(answer({ kind: 'signedOut' }));
    expect(sessionStore.getState()).toMatchObject({ status: 'signedOut', afterSignOut: true });
    expect(firebaseAuth.signOut).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe('signOut and the route guards', () => {
  it('turns the guards to signed-out at once, before any cleanup finishes', async () => {
    sessionStore.setReady();
    const pending = signOut();
    expect(sessionStore.getState()).toMatchObject({ status: 'signedOut', afterSignOut: true });
    await pending;
  });
});
