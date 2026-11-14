import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import {
  ApiError,
  describeError,
  isSessionInvalid,
  normalizeApiError,
  toApiError,
} from '../services/apiError';

const config = {
  headers: new AxiosHeaders({ Authorization: 'Bearer secret-token' }),
} as InternalAxiosRequestConfig;

function httpError(status: number, data: unknown = {}): AxiosError {
  return new AxiosError(
    'Request failed',
    'ERR_BAD_RESPONSE',
    config,
    {},
    {
      status,
      statusText: '',
      data,
      headers: {},
      config,
    }
  );
}

describe('normalizeApiError', () => {
  it('reads the status and the server message of an http error', () => {
    const n = normalizeApiError(httpError(404, { success: false, message: 'User not found' }));
    expect(n).toMatchObject({
      kind: 'http',
      status: 404,
      message: 'User not found',
      retryable: false,
    });
  });

  it('marks 5xx, 408 and 429 as retryable and other 4xx as not', () => {
    expect(normalizeApiError(httpError(500)).retryable).toBe(true);
    expect(normalizeApiError(httpError(503)).retryable).toBe(true);
    expect(normalizeApiError(httpError(429)).retryable).toBe(true);
    expect(normalizeApiError(httpError(408)).retryable).toBe(true);
    expect(normalizeApiError(httpError(400)).retryable).toBe(false);
    expect(normalizeApiError(httpError(401)).retryable).toBe(false);
  });

  it('treats a request that never got an answer as offline', () => {
    const error = new AxiosError('Network Error', 'ERR_NETWORK', config, {});
    expect(normalizeApiError(error)).toMatchObject({
      kind: 'offline',
      code: 'ERR_NETWORK',
      retryable: true,
    });
  });

  it('recognises a timeout by code and by message', () => {
    const byCode = new AxiosError('x', 'ECONNABORTED', config, {});
    expect(normalizeApiError(byCode)).toMatchObject({ kind: 'timeout', retryable: true });
    expect(normalizeApiError(new Error('timeout of 10000ms exceeded')).kind).toBe('timeout');
  });

  it('keeps the Firebase code and says only a network failure is retryable', () => {
    const weak = Object.assign(new Error('Firebase: weak'), { code: 'auth/weak-password' });
    const net = Object.assign(new Error('Firebase: net'), { code: 'auth/network-request-failed' });
    expect(normalizeApiError(weak)).toMatchObject({
      kind: 'unknown',
      code: 'auth/weak-password',
      retryable: false,
    });
    expect(normalizeApiError(net)).toMatchObject({
      code: 'auth/network-request-failed',
      retryable: true,
    });
  });

  it('survives values that are not errors', () => {
    expect(normalizeApiError(undefined)).toMatchObject({ kind: 'unknown', retryable: false });
    expect(normalizeApiError('boom')).toMatchObject({ kind: 'unknown', message: 'boom' });
    expect(normalizeApiError(null).kind).toBe('unknown');
  });

  it('falls back to the status text, then to "HTTP <status>"', () => {
    const withText = new AxiosError(
      'x',
      'ERR_BAD_RESPONSE',
      config,
      {},
      {
        status: 502,
        statusText: 'Bad Gateway',
        data: '',
        headers: {},
        config,
      }
    );
    expect(normalizeApiError(withText).message).toBe('Bad Gateway');
    expect(normalizeApiError(httpError(500)).message).toBe('HTTP 500');
  });
});

describe('isSessionInvalid', () => {
  it('is true for 401 only: 403 means the wrong role, not a bad session', () => {
    expect(isSessionInvalid(normalizeApiError(httpError(401)))).toBe(true);
    expect(isSessionInvalid(normalizeApiError(httpError(403)))).toBe(false);
    expect(isSessionInvalid(normalizeApiError(httpError(404)))).toBe(false);
    expect(isSessionInvalid(normalizeApiError(httpError(500)))).toBe(false);
    expect(
      isSessionInvalid(normalizeApiError(new AxiosError('x', 'ERR_NETWORK', config, {})))
    ).toBe(false);
  });
});

describe('describeError', () => {
  it('never includes the request headers, so a token cannot reach a log', () => {
    const text = describeError(httpError(500, { message: 'oops' }));
    expect(text).not.toContain('secret-token');
    expect(text).not.toContain('Bearer');
    expect(text.startsWith('http 500')).toBe(true);
  });
});

describe('cancelled requests', () => {
  it('are their own kind, so a screen can ignore them', () => {
    const byCode = new AxiosError('canceled', 'ERR_CANCELED', config, {});
    const abort = Object.assign(new Error('aborted'), { name: 'AbortError' });
    expect(normalizeApiError(byCode)).toMatchObject({ kind: 'cancelled', retryable: false });
    expect(normalizeApiError(abort).kind).toBe('cancelled');
  });
});

describe('ApiError', () => {
  it('is an Error carrying kind, status, code and the original response', () => {
    const wrapped = toApiError(httpError(503, { message: 'Coach is down' }));
    expect(wrapped).toBeInstanceOf(Error);
    expect(wrapped).toBeInstanceOf(ApiError);
    expect(wrapped).toMatchObject({
      kind: 'http',
      status: 503,
      message: 'Coach is down',
      retryable: true,
    });
    expect((wrapped.response as { status: number }).status).toBe(503);
  });

  it('normalises to itself and is not wrapped twice', () => {
    const wrapped = toApiError(new AxiosError('Network Error', 'ERR_NETWORK', config, {}));
    expect(toApiError(wrapped)).toBe(wrapped);
    expect(normalizeApiError(wrapped)).toMatchObject({ kind: 'offline', code: 'ERR_NETWORK' });
  });
});
