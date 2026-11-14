import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { config } from '../config';
import { normalizeApiError, toApiError } from './apiError';
import { renewSession } from './sessionRenewal';
import { tokenStore } from './tokenStore';

/**
 * The api client. Every failure is rejected as an `ApiError` (kind `offline`, `timeout`, `http`,
 * `cancelled` or `unknown`, plus status and code); see `services/apiError.ts`.
 *
 * A 401 means the token is missing, invalid or expired. The client renews it once from the Firebase
 * session (single-flight, `sessionRenewal.ts`) and repeats the request. If the session cannot be
 * renewed it calls the session-expired handler (the app signs the user out) and rejects.
 */
interface AuthHandlers {
  /** The session is gone and cannot be renewed. Registered once by the app (`services/launch.ts`). */
  onSessionExpired: () => void;
}
let handlers: AuthHandlers = { onSessionExpired: () => undefined };

export function configureApiAuth(next: AuthHandlers): void {
  handlers = next;
}

type RetryableConfig = InternalAxiosRequestConfig & { _renewed?: boolean };

// eslint-disable-next-line import/no-named-as-default-member -- axios.create is the documented API
const apiClient = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: config.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the api token to every request (read again on a retry, so a renewed token is used).
apiClient.interceptors.request.use(async (requestConfig) => {
  const token = await tokenStore.getToken();
  if (token) {
    requestConfig.headers.Authorization = `Bearer ${token}`;
  } else {
    delete requestConfig.headers.Authorization;
  }
  return requestConfig;
});

/** Sign-in routes answer 401 for wrong credentials; renewing a session there makes no sense. */
const isAuthRoute = (url?: string) => !!url && url.startsWith('/auth/');

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined;
    const normalized = normalizeApiError(error);

    const unauthorized = normalized.kind === 'http' && normalized.status === 401;
    if (unauthorized && original && !isAuthRoute(original.url)) {
      if (original._renewed) {
        // Even the renewed token is refused: the session is gone.
        handlers.onSessionExpired();
      } else {
        original._renewed = true;
        let result: Awaited<ReturnType<typeof renewSession>>;
        try {
          result = await renewSession();
        } catch (renewError) {
          throw toApiError(renewError);
        }
        if (result === 'renewed') return apiClient.request(original);
        handlers.onSessionExpired();
      }
    }
    throw toApiError(error);
  }
);

export default apiClient;
