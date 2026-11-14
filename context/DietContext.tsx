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
import { dietQuery } from '../hooks/queries';
import { onboardingService } from '../services';
import { logError } from '../services/apiError';
import { queryKeys } from '../services/queryKeys';
import { registerSessionResetter } from '../services/session';

export interface DietOnboardingData {
  dietPreference?: 'vegetarian' | 'vegan' | 'non-veg' | 'flexible';
  allergies?: string;
  hasAllergies?: boolean;
  mealsPerDay?: number;
  supplements?: string;
  takesSupplements?: boolean;
  foodImage?: string;
  scanId?: string;
  barcodeData?: string;
}

/** What belongs to the scan in progress, not to the user's saved answers. */
type ScanState = Pick<DietOnboardingData, 'scanId' | 'barcodeData'>;

interface DietContextType {
  /** The saved answers (from the query cache) plus the scan in progress. */
  dietData: DietOnboardingData;
  updateDietData: (data: Partial<DietOnboardingData>) => Promise<void>;
  loadDietData: (data: DietOnboardingData) => void;
  resetDietData: () => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  totalSteps: number;
}

const DietContext = createContext<DietContextType | undefined>(undefined);

const TOTAL_STEPS = 6;

/**
 * Mounted once, in the root layout. The saved answers are server data and live in the query cache; this
 * context keeps the wizard step and the scan in progress (`scanId`, `barcodeData`).
 */
export const DietProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const client = useQueryClient();
  const { data: saved } = useQuery({ ...dietQuery, enabled: false });
  const [scan, setScan] = useState<ScanState>({});
  const [currentStep, setCurrentStep] = useState(0);
  // The latest merged value, so two updates in a row (before React re-renders) do not overwrite each other.
  const latest = useRef<DietOnboardingData>({});

  const dietData = useMemo<DietOnboardingData>(
    () => ({ ...(saved ?? {}), ...scan }),
    [saved, scan]
  );
  useEffect(() => {
    latest.current = dietData;
  }, [dietData]);

  const updateDietData = useCallback(
    async (data: Partial<DietOnboardingData>) => {
      const merged = { ...latest.current, ...data };
      latest.current = merged;
      const { scanId, barcodeData, ...answers } = merged;
      setScan({ scanId, barcodeData });
      client.setQueryData(queryKeys.diet, answers);

      // Save to backend after each update
      try {
        await onboardingService.saveDietOnboardingData({
          dietPreference: merged.dietPreference,
          allergies: merged.allergies,
          hasAllergies: merged.hasAllergies,
          mealsPerDay: merged.mealsPerDay,
          supplements: merged.supplements,
          takesSupplements: merged.takesSupplements,
          foodImage: merged.foodImage,
        });
      } catch (error) {
        logError('diet.save', error);
      }
    },
    [client]
  );

  const loadDietData = useCallback(
    (data: DietOnboardingData) => {
      client.setQueryData(queryKeys.diet, data);
    },
    [client]
  );

  const resetDietData = useCallback(() => {
    latest.current = {};
    setScan({});
    setCurrentStep(0);
  }, []);

  useEffect(() => registerSessionResetter(resetDietData), [resetDietData]);

  const value = useMemo<DietContextType>(
    () => ({
      dietData,
      updateDietData,
      loadDietData,
      resetDietData,
      currentStep,
      setCurrentStep,
      totalSteps: TOTAL_STEPS,
    }),
    [dietData, updateDietData, loadDietData, resetDietData, currentStep]
  );

  return <DietContext.Provider value={value}>{children}</DietContext.Provider>;
};

export const useDiet = () => {
  const context = useContext(DietContext);
  if (!context) {
    throw new Error('useDiet must be used within a DietProvider');
  }
  return context;
};
