import React, { createContext, ReactNode, useContext, useState } from 'react';
import { UserOnboardingData } from '../services/userService';

interface OnboardingContextType {
  onboardingData: UserOnboardingData;
  updateOnboardingData: (data: Partial<UserOnboardingData>) => void;
  resetOnboardingData: () => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  totalSteps: number;
  isUpdateMode: boolean;
  setIsUpdateMode: (isUpdate: boolean) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const initialOnboardingData: UserOnboardingData = {
  email: undefined,
  authProvider: undefined,
  source: undefined,
  dateOfBirth: undefined,
  gender: undefined,
  height: undefined,
  weight: undefined,
  fitnessLevel: undefined,
  activityLevel: undefined,
  workoutsPerWeek: undefined,
  equipment: undefined,
  goal: undefined,
  currentPhysique: undefined,
  projectedPhysique: undefined,
};

export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [onboardingData, setOnboardingData] = useState<UserOnboardingData>(initialOnboardingData);
  const [currentStep, setCurrentStep] = useState(0);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const totalSteps = 10;

  const updateOnboardingData = (data: Partial<UserOnboardingData>) => {
    setOnboardingData((prev) => ({ ...prev, ...data }));
  };

  const resetOnboardingData = () => {
    setOnboardingData(initialOnboardingData);
    setCurrentStep(0);
  };

  return (
    <OnboardingContext.Provider
      value={{
        onboardingData,
        updateOnboardingData,
        resetOnboardingData,
        currentStep,
        setCurrentStep,
        totalSteps,
        isUpdateMode,
        setIsUpdateMode,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
