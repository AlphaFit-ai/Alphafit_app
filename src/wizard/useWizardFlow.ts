import { router } from 'expo-router';
import { useCallback } from 'react';
import { useDiet } from '../../context/DietContext';
import { useProjection } from '../../context/ProjectionContext';
import { useDietData, useProjectionData } from '../../hooks/queries';
import { useProfileUpdateNavigation } from '../../hooks/useProfileUpdateNavigation';
import type { DietOnboardingData } from '../../services/onboardingService';
import type { StepConfig } from './flows';

/**
 * What a wizard step needs from its flow, the same for Diet and Projection: the saved answers (so an
 * edited question shows the current answer selected), a way to save, and real back and forward
 * navigation. In the tabs "forward" is the next step of the flow; when the question was opened from the
 * profile ("edit this answer") it saves and returns to the profile.
 */
export function useWizardFlow(step: StepConfig) {
  const diet = useDiet();
  const projection = useProjection();
  // Subscribing starts the load when the question is opened on its own (from the profile).
  const dietQuery = useDietData();
  const projectionQuery = useProjectionData();
  const { navigateAfterUpdate, isUpdatingFromProfile } = useProfileUpdateNavigation();
  const isDiet = step.flow === 'diet';

  const saved = (isDiet ? diet.dietData : projection.projectionData) as unknown as Record<
    string,
    unknown
  >;
  const query = isDiet ? dietQuery : projectionQuery;
  /** Editing from the profile and the saved answers have not arrived yet. */
  const loading =
    isUpdatingFromProfile && query.data === undefined && query.isPending && !query.isPaused;

  const save = useCallback(
    async (patch: Record<string, unknown>) => {
      if (isDiet) await diet.updateDietData(patch as Partial<DietOnboardingData>);
      else await projection.updateProjectionData(patch);
    },
    [isDiet, diet, projection]
  );

  const next = useCallback(() => {
    if (isUpdatingFromProfile) navigateAfterUpdate();
    else if (isDiet) diet.setCurrentStep(step.index + 1);
    else projection.setCurrentStep(step.index + 1);
  }, [isUpdatingFromProfile, navigateAfterUpdate, isDiet, diet, projection, step.index]);

  const back = useCallback(() => {
    if (isUpdatingFromProfile) router.back();
    else if (isDiet) diet.setCurrentStep(Math.max(0, step.index - 1));
    else projection.goBack();
  }, [isUpdatingFromProfile, isDiet, diet, projection, step.index]);

  return {
    saved,
    loading,
    save,
    next,
    back,
    editing: isUpdatingFromProfile,
    /** The first question of the Diet tab has nothing before it. */
    hideBack: !isUpdatingFromProfile && isDiet && step.index === 0,
  };
}
