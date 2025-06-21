'use client';

import React, { 
  createContext, 
  useState, 
  useContext, 
  useCallback 
} from 'react';
import { z } from 'zod';

export type WizardContextType<T> = {
  data: T;
  updateData: (newData: Partial<T>) => void;
  validateStep: () => boolean;
  errors: Record<string, string>;
};

type WizardProviderProps<T> = {
  initialData: T;
  children: React.ReactNode;
  validationSchema?: z.ZodSchema<T>;
};

const WizardContext = createContext<WizardContextType<any> | null>(null);

export function WizardProvider<T>({ 
  initialData, 
  children, 
  validationSchema 
}: WizardProviderProps<T>) {
  const [data, setData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateData = useCallback((newData: Partial<T>) => {
    setData(prev => ({ ...prev, ...newData }));
  }, []);

  const validateStep = useCallback(() => {
    if (!validationSchema) return true;

    try {
      validationSchema.parse(data);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMap = error.flatten().fieldErrors;
        const formattedErrors: Record<string, string> = {};
        
        Object.entries(errorMap).forEach(([key, messages]) => {
          if (messages && messages.length > 0) {
            formattedErrors[key] = messages[0];
          }
        });

        setErrors(formattedErrors);
        return Object.keys(formattedErrors).length === 0;
      }
      return false;
    }
  }, [data, validationSchema]);

  const contextValue: WizardContextType<T> = {
    data,
    updateData,
    validateStep,
    errors
  };

  return (
    <WizardContext.Provider value={contextValue}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizardStep<T>(
  initialData: T, 
  validationSchema?: z.ZodSchema<T>
): WizardContextType<T> {
  const context = useContext(WizardContext);

  if (!context) {
    throw new Error('useWizardStep must be used within a WizardProvider');
  }

  return context as WizardContextType<T>;
}

export const VendorWizard: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  return (
    <div className="vendor-wizard-container" data-testid="wizard-container">
      {children}
    </div>
  );
};

export default VendorWizard; 