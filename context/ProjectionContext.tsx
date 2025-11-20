import React, { createContext, ReactNode, useContext, useState } from 'react';

interface ProjectionData {
  sleepHours?: string;
  dailySteps?: string;
  stressLevel?: string;
}

interface ProjectionContextType {
  projectionData: ProjectionData;
  updateProjectionData: (data: Partial<ProjectionData>) => void;
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

export const ProjectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projectionData, setProjectionData] = useState<ProjectionData>(initialProjectionData);
  const [currentStep, setCurrentStep] = useState(0);
  const [navigationHistory, setNavigationHistory] = useState<number[]>([0]);
  const totalSteps = 6;

  const updateProjectionData = (data: Partial<ProjectionData>) => {
    setProjectionData((prev) => ({ ...prev, ...data }));
  };

  const handleSetCurrentStep = (step: number) => {
    setNavigationHistory((prev) => [...prev, step]);
    setCurrentStep(step);
  };

  const goBack = () => {
    if (navigationHistory.length > 1) {
      const newHistory = [...navigationHistory];
      newHistory.pop(); // Remove current step
      const previousStep = newHistory[newHistory.length - 1];
      setNavigationHistory(newHistory);
      setCurrentStep(previousStep);
    }
  };

  const resetProjectionData = () => {
    setProjectionData(initialProjectionData);
    setCurrentStep(0);
    setNavigationHistory([0]);
  };

  return (
    <ProjectionContext.Provider
      value={{
        projectionData,
        updateProjectionData,
        resetProjectionData,
        currentStep,
        setCurrentStep: handleSetCurrentStep,
        goBack,
        totalSteps,
      }}
    >
      {children}
    </ProjectionContext.Provider>
  );
};

export const useProjection = (): ProjectionContextType => {
  const context = useContext(ProjectionContext);
  if (!context) {
    throw new Error('useProjection must be used within a ProjectionProvider');
  }
  return context;
};
