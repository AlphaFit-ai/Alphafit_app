/**
 * One place that turns whatever a request threw (axios error, Firebase error, plain Error) into a
 * small shape the UI can branch on, and that is safe to log: it never carries headers, request
 * bodies or tokens.
 */

export type ApiErrorKind = 'offline' | 'timeout' | 'http' | 'cancelled' | 'unknown';

export interface NormalizedError {
  kind: ApiErrorKind;
  /** HTTP status, only when the server answered. */
  status?: number;
  /** Transport code (`ECONNABORTED`, `ERR_NETWORK`) or Firebase code (`auth/...`). */
  code?: string;
  /** Human readable, not localised. Server messages are used only when the server answered. */
  message: string;
  /** True when trying again can plausibly succeed: no connection, timeout, 5xx, 408 or 429. */
  retryable: boolean;
}

interface ResponseLike {
  status?: unknown;
  data?: unknown;
  statusText?: unknown;
}

interface ErrorLike {
  code?: unknown;
  message?: unknown;
  response?: ResponseLike | null;
  request?: unknown;
}

function asRecord<T extends object = ErrorLike>(value: unknown): T | null {
  return value !== null && typeof value === 'object' ? (value as T) : null;
}

function readServerMessage(data: unknown): string | undefined {
  const record = asRecord<{ message?: unknown; error?: unknown }>(data);
  if (!record)
    return typeof data === 'string' && data.length > 0 && data.length < 200 ? data : undefined;
  if (typeof record.message === 'string' && record.message) return record.message;
  if (typeof record.error === 'string' && record.error) return record.error;
  return undefined;
}

const TIMEOUT_CODES = new Set(['ECONNABORTED', 'ETIMEDOUT', 'ERR_TIMEOUT']);

export function normalizeApiError(error: unknown): NormalizedError {
  if (error instanceof ApiError) return error.normalized;
  const record = asRecord(error);
  if (!record) {
    return {
      kind: 'unknown',
      message: typeof error === 'string' ? error : 'Unknown error',
      retryable: false,
    };
  }

  const code = typeof record.code === 'string' ? record.code : undefined;
  const message = typeof record.message === 'string' ? record.message : 'Unknown error';

  // The caller (a screen leaving, a newer request) gave up: not a failure to show.
  const name = (error as { name?: unknown }).name;
  if (code === 'ERR_CANCELED' || name === 'CanceledError' || name === 'AbortError') {
    return { kind: 'cancelled', code, message, retryable: false };
  }

  const response = asRecord<ResponseLike>(record.response);
  if (response && typeof response.status === 'number') {
    const status = response.status;
    return {
      kind: 'http',
      status,
      code,
      message:
        readServerMessage(response.data) ??
        (typeof response.statusText === 'string' && response.statusText
          ? response.statusText
          : `HTTP ${status}`),
      retryable: status >= 500 || status === 408 || status === 429,
    };
  }

  // Firebase and other non-HTTP failures carry their own code.
  if (code && code.startsWith('auth/')) {
    return {
      kind: 'unknown',
      code,
      message,
      retryable: code === 'auth/network-request-failed',
    };
  }

  if ((code && TIMEOUT_CODES.has(code)) || /timeout/i.test(message)) {
    return { kind: 'timeout', code, message, retryable: true };
  }

  // axios reports "no response" for a lost connection, DNS failure, refused connection, etc.
  if (code === 'ERR_NETWORK' || record.request !== undefined || /network/i.test(message)) {
    return { kind: 'offline', code, message, retryable: true };
  }

  return { kind: 'unknown', code, message, retryable: false };
}

/**
 * The token is missing, invalid or expired: the api answers 401 for exactly this (CONTRACTS section 1).
 * 403 means "wrong role", not a bad session, so it does not sign anyone out.
 */
export function isSessionInvalid(error: NormalizedError): boolean {
  return error.kind === 'http' && error.status === 401;
}

/** One line that is safe to put in a log: no body, no headers, no personal data. */
export function describeError(error: unknown): string {
  const n = normalizeApiError(error);
  const parts: string[] = [n.kind];
  if (n.status !== undefined) parts.push(String(n.status));
  if (n.code) parts.push(n.code);
  // A server message can echo user input, so it stays out of release logs.
  if (n.kind !== 'http' || __DEV__) parts.push(n.message);
  return parts.join(' ');
}

export function logError(context: string, error: unknown): void {
  console.error(`[${context}] ${describeError(error)}`);
}

/**
 * What the api client rejects with. It is an `Error` (so `error.message` still works) that carries the
 * normalised kind, status and code, plus the original `response` so older code reading
 * `error.response.status` keeps working.
 */
export class ApiError extends Error {
  readonly normalized: NormalizedError;
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly code?: string;
  readonly retryable: boolean;
  readonly response?: unknown;

  constructor(normalized: NormalizedError, cause?: unknown) {
    super(normalized.message);
    this.name = 'ApiError';
    this.normalized = normalized;
    this.kind = normalized.kind;
    this.status = normalized.status;
    this.code = normalized.code;
    this.retryable = normalized.retryable;
    this.response = (cause as { response?: unknown } | null)?.response;
    this.cause = cause;
  }
}

export function toApiError(error: unknown): ApiError {
  return error instanceof ApiError ? error : new ApiError(normalizeApiError(error), error);
}
