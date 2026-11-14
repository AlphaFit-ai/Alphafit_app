import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { projectionQuery } from '../hooks/queries';
import { logError } from '../services/apiError';
import { onboardingService } from '../services';
import { queryKeys } from '../services/queryKeys';
import { registerSessionResetter } from '../services/session';

interface ProjectionData {
  sleepHours?: string;
  dailySteps?: string;
  stressLevel?: string;
  frontPhotoUrl?: string;
  sidePhotoUrl?: string;
  backPhotoUrl?: string;
}

interface ProjectionContextType {
  projectionData: ProjectionData;
  updateProjectionData: (data: Partial<ProjectionData>) => Promise<void>;
  loadProjectionData: (data: ProjectionData) => void;
  resetProjectionData: () => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  goBack: () => void;
  totalSteps: number;
}

const ProjectionContext = createContext<ProjectionContextType | undefined>(undefined);

const initialProjectionData: ProjectionData = {
  sleepHours: undefined,
  dailySteps: undefined,
  stressLevel: undefined,
};

const TOTAL_STEPS = 6;

/**
 * Mounted once, in the root layout. The answers are server data and live in the query cache; this
 * context keeps the wizard step and the back history.
 */
export const ProjectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const client = useQueryClient();
  const { data } = useQuery({ ...projectionQuery, enabled: false });
  const projectionData: ProjectionData = data ?? initialProjectionData;
  const [currentStep, setCurrentStep] = useState(0);
  // Steps the user has visited, so Back returns to the previous one rather than to step - 1.
  const history = useRef<number[]>([0]);

  const updateProjectionData = useCallback(
    async (patch: Partial<ProjectionData>) => {
      client.setQueryData<ProjectionData | null>(queryKeys.projection, (prev) => ({
        ...(prev ?? {}),
        ...patch,
      }));

      // Save to backend after each update - only send the fields that were actually provided
      try {
        const dataToSave: Partial<ProjectionData> = {};
        if (patch.sleepHours !== undefined) dataToSave.sleepHours = patch.sleepHours;
        if (patch.dailySteps !== undefined) dataToSave.dailySteps = patch.dailySteps;
        if (patch.stressLevel !== undefined) dataToSave.stressLevel = patch.stressLevel;
        if (patch.frontPhotoUrl !== undefined) dataToSave.frontPhotoUrl = patch.frontPhotoUrl;
        if (patch.sidePhotoUrl !== undefined) dataToSave.sidePhotoUrl = patch.sidePhotoUrl;
        if (patch.backPhotoUrl !== undefined) dataToSave.backPhotoUrl = patch.backPhotoUrl;

        await onboardingService.saveProjectionOnboardingData(dataToSave);
      } catch (error) {
        logError('projection.save', error);
      }
    },
    [client]
  );

  const loadProjectionData = useCallback(
    (next: ProjectionData) => {
      client.setQueryData(queryKeys.projection, next);
    },
    [client]
  );

  const handleSetCurrentStep = useCallback((step: number) => {
    history.current = [...history.current, step];
    setCurrentStep(step);
  }, []);

  const goBack = useCallback(() => {
    if (history.current.length <= 1) return;
    history.current = history.current.slice(0, -1); // Remove current step
    setCurrentStep(history.current[history.current.length - 1]);
  }, []);

  const resetProjectionData = useCallback(() => {
    setCurrentStep(0);
    history.current = [0];
  }, []);

  useEffect(() => registerSessionResetter(resetProjectionData), [resetProjectionData]);

  const value = useMemo<ProjectionContextType>(
    () => ({
      projectionData,
      updateProjectionData,
      loadProjectionData,
      resetProjectionData,
      currentStep,
      setCurrentStep: handleSetCurrentStep,
      goBack,
      totalSteps: TOTAL_STEPS,
    }),
    [
      projectionData,
      updateProjectionData,
      loadProjectionData,
      resetProjectionData,
      currentStep,
      handleSetCurrentStep,
      goBack,
    ]
  );

  return <ProjectionContext.Provider value={value}>{children}</ProjectionContext.Provider>;
};

export const useProjection = (): ProjectionContextType => {
  const context = useContext(ProjectionContext);
  if (!context) {
    throw new Error('useProjection must be used within a ProjectionProvider');
  }
  return context;
};
