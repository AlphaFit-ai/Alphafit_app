import axios, { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import apiClient, { configureApiAuth } from '../services/apiClient';
import { ApiError } from '../services/apiError';
import { tokenStore } from '../services/tokenStore';

const firebaseAuth = jest.requireMock('firebase/auth');

type Adapter = (config: InternalAxiosRequestConfig) => Promise<unknown>;
const useAdapter = (adapter: Adapter) => {
  apiClient.defaults.adapter = adapter as never;
};
const authHeader = (config: InternalAxiosRequestConfig) =>
  String(AxiosHeaders.from(config.headers).get('Authorization'));

const ok = (config: InternalAxiosRequestConfig, data: unknown = { ok: true }) =>
  Promise.resolve({ data, status: 200, statusText: 'OK', headers: {}, config });
const fail = (config: InternalAxiosRequestConfig, status: number) =>
  Promise.reject(
    new AxiosError(
      'failed',
      'ERR_BAD_RESPONSE',
      config,
      {},
      { status, statusText: '', data: { message: 'nope' }, headers: {}, config }
    )
  );

const onSessionExpired = jest.fn();
let renewPost: jest.SpyInstance;

/** Firebase has a signed-in user whose ID token can be refreshed. */
function signedInWithFirebase() {
  firebaseAuth.__mockAuth.currentUser = {
    providerData: [{ providerId: 'google.com' }],
    getIdToken: jest.fn().mockResolvedValue('fresh-firebase-id-token'),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  configureApiAuth({ onSessionExpired });
  firebaseAuth.__mockAuth.currentUser = null;
  renewPost = jest
    .spyOn(axios, 'post')
    .mockResolvedValue({ data: { token: 'renewed-token', userId: 'u1' } });
});
afterEach(() => renewPost.mockRestore());

describe('apiClient', () => {
  it('is pointed at the configured api address', () => {
    expect(apiClient.defaults.baseURL).toBe('https://api.test.invalid');
  });

  it('sends the stored token as a Bearer header, and none when nobody is signed in', async () => {
    const seen: string[] = [];
    useAdapter((config) => {
      seen.push(authHeader(config));
      return ok(config);
    });
    await apiClient.get('/auth/check-email');
    await tokenStore.save('the-token', 'user-1');
    await apiClient.get('/users/profile');
    expect(seen).toEqual(['undefined', 'Bearer the-token']);
  });

  describe('failures are typed', () => {
    it('rejects with an ApiError: kind, status and the server message', async () => {
      useAdapter((config) => fail(config, 500));
      const failure = await apiClient.get('/onboarding').catch((e) => e);
      expect(failure).toBeInstanceOf(ApiError);
      expect(failure).toMatchObject({
        kind: 'http',
        status: 500,
        retryable: true,
        message: 'nope',
      });
      expect(failure.response.status).toBe(500); // older code reading error.response keeps working
    });

    it('says offline for a request that got no answer, keeping the code', async () => {
      useAdapter((config) =>
        Promise.reject(new AxiosError('Network Error', 'ERR_NETWORK', config, {}))
      );
      const failure = await apiClient.get('/onboarding').catch((e) => e);
      expect(failure).toMatchObject({
        kind: 'offline',
        code: 'ERR_NETWORK',
        message: 'Network Error',
      });
    });

    it('says timeout when the request ran out of time', async () => {
      useAdapter((config) =>
        Promise.reject(new AxiosError('timeout of 10000ms exceeded', 'ECONNABORTED', config, {}))
      );
      expect(await apiClient.get('/onboarding').catch((e) => e)).toMatchObject({ kind: 'timeout' });
    });

    it('says cancelled when the caller aborts, and the request never reaches the network', async () => {
      const adapter = jest.fn((config: InternalAxiosRequestConfig) => ok(config));
      useAdapter(adapter);
      const controller = new AbortController();
      controller.abort();
      const failure = await apiClient
        .get('/food-scans/1', { signal: controller.signal })
        .catch((e) => e);
      expect(failure).toMatchObject({ kind: 'cancelled' });
    });
  });

  describe('a 401 renews the session once, from Firebase', () => {
    it('gets a new api token, stores it, and repeats the request with it', async () => {
      signedInWithFirebase();
      await tokenStore.save('expired-token', 'u1');
      const seen: string[] = [];
      useAdapter((config) => {
        seen.push(authHeader(config));
        return authHeader(config) === 'Bearer renewed-token'
          ? ok(config, { name: 'Ann' })
          : fail(config, 401);
      });

      const response = await apiClient.get('/users/profile');

      expect(response.data).toEqual({ name: 'Ann' });
      expect(seen).toEqual(['Bearer expired-token', 'Bearer renewed-token']);
      expect(renewPost).toHaveBeenCalledTimes(1);
      expect(renewPost.mock.calls[0][1]).toEqual({
        idToken: 'fresh-firebase-id-token',
        provider: 'google',
      });
      expect(await tokenStore.getToken()).toBe('renewed-token');
      expect(onSessionExpired).not.toHaveBeenCalled();
    });

    it('is single-flight: three requests that fail together cause one renewal', async () => {
      signedInWithFirebase();
      await tokenStore.save('expired-token', 'u1');
      useAdapter((config) =>
        authHeader(config) === 'Bearer renewed-token' ? ok(config) : fail(config, 401)
      );

      const results = await Promise.all([
        apiClient.get('/users/profile'),
        apiClient.get('/onboarding'),
        apiClient.get('/food-scans'),
      ]);

      expect(results.map((r) => r.status)).toEqual([200, 200, 200]);
      expect(renewPost).toHaveBeenCalledTimes(1);
      expect(firebaseAuth.__mockAuth.currentUser.getIdToken).toHaveBeenCalledTimes(1);
    });

    it('also renews when there is no api token at all but Firebase still has the session', async () => {
      signedInWithFirebase();
      useAdapter((config) =>
        authHeader(config) === 'Bearer renewed-token' ? ok(config) : fail(config, 401)
      );
      await expect(apiClient.get('/users/profile')).resolves.toMatchObject({ status: 200 });
    });

    it('signs out when there is no Firebase session to renew from', async () => {
      await tokenStore.save('expired-token', 'u1');
      useAdapter((config) => fail(config, 401));
      const failure = await apiClient.get('/users/profile').catch((e) => e);
      expect(failure).toMatchObject({ kind: 'http', status: 401 });
      expect(onSessionExpired).toHaveBeenCalledTimes(1);
      expect(renewPost).not.toHaveBeenCalled();
    });

    it('signs out when the api refuses the Firebase token', async () => {
      signedInWithFirebase();
      renewPost.mockRejectedValue(
        new AxiosError(
          'x',
          'ERR_BAD_REQUEST',
          undefined,
          {},
          {
            status: 401,
            statusText: '',
            data: {},
            headers: {},
            config: {} as InternalAxiosRequestConfig,
          }
        )
      );
      useAdapter((config) => fail(config, 401));
      await apiClient.get('/users/profile').catch(() => undefined);
      expect(onSessionExpired).toHaveBeenCalledTimes(1);
    });

    it('signs out when even the renewed token is refused, and does not loop', async () => {
      signedInWithFirebase();
      await tokenStore.save('expired-token', 'u1');
      const adapter = jest.fn((config: InternalAxiosRequestConfig) => fail(config, 401));
      useAdapter(adapter);
      await apiClient.get('/users/profile').catch(() => undefined);
      expect(adapter).toHaveBeenCalledTimes(2); // the request and one retry
      expect(renewPost).toHaveBeenCalledTimes(1);
      expect(onSessionExpired).toHaveBeenCalledTimes(1);
    });

    it('does NOT sign out when the renewal fails only because the connection is down', async () => {
      signedInWithFirebase();
      await tokenStore.save('expired-token', 'u1');
      renewPost.mockRejectedValue(new AxiosError('Network Error', 'ERR_NETWORK', undefined, {}));
      useAdapter((config) => fail(config, 401));

      const failure = await apiClient.get('/users/profile').catch((e) => e);

      expect(failure).toMatchObject({ kind: 'offline' });
      expect(onSessionExpired).not.toHaveBeenCalled();
      expect(await tokenStore.getToken()).toBe('expired-token');
    });

    it('leaves the sign-in routes alone: a 401 there is a wrong credential, not an expired session', async () => {
      signedInWithFirebase();
      useAdapter((config) => fail(config, 401));
      await apiClient.post('/auth/firebase', {}).catch(() => undefined);
      expect(renewPost).not.toHaveBeenCalled();
      expect(onSessionExpired).not.toHaveBeenCalled();
    });

    it.each([403, 404, 500])(
      'does nothing about a %s (403 is the wrong role, not a bad session)',
      async (status) => {
        signedInWithFirebase();
        await tokenStore.save('good-token', 'u1');
        useAdapter((config) => fail(config, status));
        await apiClient.get('/onboarding').catch(() => undefined);
        expect(renewPost).not.toHaveBeenCalled();
        expect(onSessionExpired).not.toHaveBeenCalled();
        expect(await tokenStore.getToken()).toBe('good-token');
      }
    );
  });
});
