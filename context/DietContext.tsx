import React, { createContext, ReactNode, useContext, useState } from 'react';

export interface DietOnboardingData {
  dietPreference?: 'vegetarian' | 'vegan' | 'non-veg' | 'flexible';
  allergies?: string;
  hasAllergies?: boolean;
  mealsPerDay?: number;
  supplements?: string;
  takesSupplements?: boolean;
  foodImage?: string;
  isCompleted?: boolean;
}

interface DietContextType {
  dietData: DietOnboardingData;
  updateDietData: (data: Partial<DietOnboardingData>) => void;
  resetDietData: () => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  totalSteps: number;
}

const DietContext = createContext<DietContextType | undefined>(undefined);

const initialDietData: DietOnboardingData = {
  dietPreference: undefined,
  allergies: '',
  hasAllergies: false,
  mealsPerDay: 3,
  supplements: '',
  takesSupplements: false,
  isCompleted: false,
};

export const DietProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dietData, setDietData] = useState<DietOnboardingData>(initialDietData);
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 5;

  const updateDietData = (data: Partial<DietOnboardingData>) => {
    setDietData((prev) => ({ ...prev, ...data }));
  };

  const resetDietData = () => {
    setDietData(initialDietData);
    setCurrentStep(0);
  };

  return (
    <DietContext.Provider
      value={{
        dietData,
        updateDietData,
        resetDietData,
        currentStep,
        setCurrentStep,
        totalSteps,
      }}
    >
      {children}
    </DietContext.Provider>
  );
};

export const useDiet = () => {
  const context = useContext(DietContext);
  if (!context) {
    throw new Error('useDiet must be used within a DietProvider');
  }
  return context;
};
