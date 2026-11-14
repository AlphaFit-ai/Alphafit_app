import { useProjectionData } from './queries';

/**
 * When a projection question is opened from the profile to change the answer, show the saved answers
 * so the current one is selected. They come from the query cache (usually already loaded); if the
 * request fails the screen still works, the user just does not see the old answer pre-selected.
 */
export function useProjectionPrefill(enabled: boolean) {
  const query = useProjectionData();
  // The query is only used when editing; a cached answer is shown without waiting for the refresh.
  return {
    isLoading: enabled && query.data === undefined && query.isPending && !query.isPaused,
    savedData: enabled ? (query.data ?? null) : null,
  };
}
