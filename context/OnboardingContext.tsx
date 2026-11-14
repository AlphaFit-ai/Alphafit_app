import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { onboardingQuery } from '../hooks/queries';
import { queryKeys } from '../services/queryKeys';
import { registerSessionResetter } from '../services/session';
import { UserOnboardingData } from '../services/userService';

interface OnboardingContextType {
  /** The saved answers, read from the query cache (empty until they are loaded). */
  onboardingData: UserOnboardingData;
  /** Merge answers into the cache (the screen saves them to the api itself). */
  updateOnboardingData: (data: Partial<UserOnboardingData>) => void;
  resetOnboardingData: () => void;
  /** Replace the cached answers with what the server returned. */
  loadOnboardingData: (data: UserOnboardingData) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  totalSteps: number;
  isUpdateMode: boolean;
  setIsUpdateMode: (isUpdate: boolean) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const EMPTY: UserOnboardingData = {};
const TOTAL_STEPS = 10;

/**
 * Mounted once, in the root layout. Holds UI state for the onboarding wizard (the current step). The
 * answers themselves are server data: they live in the query cache and this context only reads and
 * patches them, so Home, Profile and the wizard always see the same copy.
 */
export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const client = useQueryClient();
  // Subscribe to the cache without fetching: whoever needs the answers loads them.
  const { data } = useQuery({ ...onboardingQuery, enabled: false });
  const [currentStep, setCurrentStep] = useState(0);
  const [isUpdateMode, setIsUpdateMode] = useState(false);

  const updateOnboardingData = useCallback(
    (patch: Partial<UserOnboardingData>) => {
      client.setQueryData<UserOnboardingData | null>(queryKeys.onboarding, (prev) => ({
        ...(prev ?? {}),
        ...patch,
      }));
    },
    [client]
  );

  const loadOnboardingData = useCallback(
    (next: UserOnboardingData) => {
      client.setQueryData(queryKeys.onboarding, next);
    },
    [client]
  );

  const resetOnboardingData = useCallback(() => {
    setCurrentStep(0);
    setIsUpdateMode(false);
  }, []);

  useEffect(() => registerSessionResetter(resetOnboardingData), [resetOnboardingData]);

  const value = useMemo<OnboardingContextType>(
    () => ({
      onboardingData: data ?? EMPTY,
      updateOnboardingData,
      loadOnboardingData,
      resetOnboardingData,
      currentStep,
      setCurrentStep,
      totalSteps: TOTAL_STEPS,
      isUpdateMode,
      setIsUpdateMode,
    }),
    [data, updateOnboardingData, loadOnboardingData, resetOnboardingData, currentStep, isUpdateMode]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};

export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
