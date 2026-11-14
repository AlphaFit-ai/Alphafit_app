import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { DietOnboardingData, useDiet } from '../../context/DietContext';
import { getDietResumeStep } from '../../services/onboardingResume';
import { queryKeys } from '../../services/queryKeys';
import { haptic } from '../ui/haptics';

/** The Diet tab's step that holds the food scan (camera, library, barcode). */
export const SCAN_STEP = 4;

/**
 * Where the scan button lands in the Diet tab: the first unanswered diet question when the setup is not
 * finished (the questions end on the scan), otherwise the scan itself. `undefined` means the answers are
 * not loaded yet: the Diet tab then positions itself when they arrive, which ends on the scan too.
 */
export function scanEntryStep(diet: DietOnboardingData | null | undefined): number | undefined {
  if (diet === undefined) return undefined;
  return getDietResumeStep(diet); // SCAN_STEP once every question is answered
}

/** Opens the food scan from anywhere in the app (the centre tab-bar button, a link to `/scan`). */
export function useOpenFoodScan() {
  const client = useQueryClient();
  const router = useRouter();
  const { setCurrentStep } = useDiet();
  return useCallback(
    ({ feedback = true }: { feedback?: boolean } = {}) => {
      if (feedback) haptic.select();
      const step = scanEntryStep(client.getQueryData<DietOnboardingData | null>(queryKeys.diet));
      if (step !== undefined) setCurrentStep(step);
      router.navigate('/(tabs)/diet');
    },
    [client, router, setCurrentStep]
  );
}
