import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';

/**
 * Hook to handle navigation after updating data from profile screen
 * If returnTo parameter exists, navigate back to profile
 * Otherwise, continue with normal onboarding flow
 */
export function useProfileUpdateNavigation() {
  const params = useLocalSearchParams();
  const returnTo = params.returnTo as string | undefined;

  const navigateAfterUpdate = useCallback((nextRoute?: string) => {
    if (returnTo === 'profile') {
      // Return to profile screen
      router.back();
    } else if (nextRoute) {
      // Continue with normal onboarding flow
      router.push(nextRoute as any);
    }
  }, [returnTo]);

  const isUpdatingFromProfile = returnTo === 'profile';

  return {
    navigateAfterUpdate,
    isUpdatingFromProfile,
  };
}
