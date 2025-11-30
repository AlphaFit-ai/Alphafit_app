import React, { createContext, ReactNode, useContext, useState } from 'react';
import { onboardingService } from '../services';

export interface DietOnboardingData {
  dietPreference?: 'vegetarian' | 'vegan' | 'non-veg' | 'flexible';
  allergies?: string;
  hasAllergies?: boolean;
  mealsPerDay?: number;
  supplements?: string;
  takesSupplements?: boolean;
  foodImage?: string;
  scanId?: string;
}

interface DietContextType {
  dietData: DietOnboardingData;
  updateDietData: (data: Partial<DietOnboardingData>) => Promise<void>;
  loadDietData: (data: DietOnboardingData) => void;
  resetDietData: () => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  totalSteps: number;
}

const DietContext = createContext<DietContextType | undefined>(undefined);

const initialDietData: DietOnboardingData = {
  dietPreference: undefined,
  allergies: undefined,
  hasAllergies: undefined,
  mealsPerDay: undefined,
  supplements: undefined,
  takesSupplements: undefined,
  foodImage: undefined,
  scanId: undefined,
};

export const DietProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dietData, setDietData] = useState<DietOnboardingData>(initialDietData);
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 6;

  const updateDietData = async (data: Partial<DietOnboardingData>) => {
    const updatedData = { ...dietData, ...data };
    setDietData(updatedData);
    
    // Save to backend after each update
    try {
      await onboardingService.saveDietOnboardingData({
        dietPreference: updatedData.dietPreference,
        allergies: updatedData.allergies,
        hasAllergies: updatedData.hasAllergies,
        mealsPerDay: updatedData.mealsPerDay,
        supplements: updatedData.supplements,
        takesSupplements: updatedData.takesSupplements,
        foodImage: updatedData.foodImage,
      });
      console.log('Diet data saved to backend:', data);
    } catch (error) {
      console.error('Failed to save diet data:', error);
    }
  };

  const loadDietData = (data: DietOnboardingData) => {
    setDietData(data);
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
        loadDietData,
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
