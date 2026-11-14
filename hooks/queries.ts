import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { foodScanService, imageService, onboardingService, userService } from '../services';
import { normalizeApiError } from '../services/apiError';
import { queryKeys } from '../services/queryKeys';

/** Data the cache holds. Hooks without `enabled: false` also fetch it; the context facades only read. */
export const profileQuery = {
  queryKey: queryKeys.profile,
  queryFn: () => userService.getUserProfile(),
};
export const onboardingQuery = {
  queryKey: queryKeys.onboarding,
  queryFn: () => onboardingService.getOnboardingData(),
};
export const dietQuery = {
  queryKey: queryKeys.diet,
  queryFn: () => onboardingService.getDietOnboardingData(),
};
export const projectionQuery = {
  queryKey: queryKeys.projection,
  queryFn: () => onboardingService.getProjectionOnboardingData(),
};
export const avatarQuery = {
  queryKey: queryKeys.avatar,
  queryFn: async (): Promise<string | null> => {
    try {
      return await imageService.getProfilePicture();
    } catch (error) {
      // No picture uploaded yet is an answer, not a failure.
      if (normalizeApiError(error).status === 404) return null;
      throw error;
    }
  },
  staleTime: 10 * 60_000,
};

export const useProfile = () => useQuery(profileQuery);
export const useOnboardingData = () => useQuery(onboardingQuery);
export const useDietData = () => useQuery(dietQuery);
export const useProjectionData = () => useQuery(projectionQuery);

/** The signed-in user's picture: fetched once and shared by the tab bar, Profile and the chat. */
export function useProfilePicture() {
  const client = useQueryClient();
  const query = useQuery(avatarQuery);
  const setUri = useCallback(
    (uri: string | null) => client.setQueryData(queryKeys.avatar, uri),
    [client]
  );
  return {
    uri: query.data ?? null,
    loaded: query.isSuccess,
    /** Nothing known yet and the first request is running: show a placeholder, not "Add photo". */
    pending: query.isPending && !query.isPaused,
    refresh: query.refetch,
    setUri,
  };
}

/** Today's totals and the latest scans (Home). */
export const useRecentScans = () =>
  useQuery({
    queryKey: queryKeys.scansRecent,
    queryFn: async () => (await foodScanService.getUserFoodScans(0, 50)).content,
  });

/** The scan history, 20 at a time. */
export const useScansHistory = () =>
  useInfiniteQuery({
    queryKey: queryKeys.scansHistory,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => foodScanService.getUserFoodScans(pageParam, 20),
    getNextPageParam: (last) => (last.number < last.totalPages - 1 ? last.number + 1 : undefined),
  });

export function useScan(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.scan(id ?? ''),
    queryFn: () => foodScanService.getFoodScan(id as string),
    enabled: !!id,
  });
}

/** Refetch a query when its screen regains focus and the data is older than `maxAgeMs`. */
export function useRefetchWhenStale(
  query: { dataUpdatedAt: number; refetch: () => unknown },
  focused: boolean,
  maxAgeMs = 60_000
) {
  const { dataUpdatedAt, refetch } = query;
  useEffect(() => {
    if (focused && dataUpdatedAt > 0 && Date.now() - dataUpdatedAt > maxAgeMs) void refetch();
  }, [focused, dataUpdatedAt, refetch, maxAgeMs]);
}
