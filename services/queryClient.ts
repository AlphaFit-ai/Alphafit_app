import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';
import { normalizeApiError } from './apiError';

/**
 * Server data lives here, not in React state: profile, onboarding answers, diet and projection
 * answers, scans and the avatar. The cache is saved on the device (so the app shows the last known
 * data at once, also offline) and is wiped by `signOut()`.
 */
const DAY_MS = 24 * 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: DAY_MS,
      // Retry a failure that can pass (no connection, timeout, 5xx), twice; never a 4xx.
      retry: (failureCount, error) => failureCount < 2 && normalizeApiError(error).retryable,
      // Without a connection a query waits for it instead of failing, and the cached data stays on screen.
      networkMode: 'online',
    },
  },
});

export const PERSIST_KEY = 'alphafit_query_cache';
/** Bump when the shape of cached data changes: an old cache is then dropped instead of misread. */
export const PERSIST_BUSTER = 'v1';

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: PERSIST_KEY,
  throttleTime: 1000,
});

export const persistOptions = {
  persister: queryPersister,
  maxAge: DAY_MS,
  buster: PERSIST_BUSTER,
  dehydrateOptions: {
    // Only answers that succeeded; never an error or a half-finished request.
    shouldDehydrateQuery: (query: { state: { status: string } }) =>
      query.state.status === 'success',
  },
};

/** Remove every cached answer, in memory and on the device. Used when the user signs out. */
export async function clearQueryCache(): Promise<void> {
  await queryClient.cancelQueries();
  // Reset every query first: a screen that is still mounted is told its data is gone (clear() alone
  // leaves observers showing their last value), and nothing is refetched.
  queryClient
    .getQueryCache()
    .getAll()
    .forEach((query) => query.reset());
  queryClient.clear();
  await queryPersister.removeClient();
}

let environmentReady = false;

/** Connect the cache to the phone: network changes pause and resume queries, app focus refetches. */
export function setupQueryEnvironment(): void {
  if (environmentReady) return;
  environmentReady = true;
  // Only "is there a network connection": NetInfo's reachability probe (a request to a third-party
  // URL) can fail on networks that block it, and queries would then wait for a connection that is there.
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => setOnline(state.isConnected !== false))
  );
  if (Platform.OS !== 'web') {
    AppState.addEventListener('change', (status) => focusManager.setFocused(status === 'active'));
  }
}
