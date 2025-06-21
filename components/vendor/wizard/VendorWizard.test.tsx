import React from 'react';
import { render, renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { z } from 'zod';
import { WizardProvider, useWizardStep, VendorWizard } from './VendorWizard';

// Test schema for validation
const TestSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.number().min(18, "Must be at least 18 years old")
});

type TestData = z.infer<typeof TestSchema>;

describe('VendorWizard', () => {
  describe('WizardProvider', () => {
    const initialData: TestData = { name: '', age: 0 };

    test('renders children', () => {
      const { getByText } = render(
        <WizardProvider initialData={initialData}>
          <div>Test Content</div>
        </WizardProvider>
      );

      expect(getByText('Test Content')).toBeInTheDocument();
    });

    test('provides context for child components', () => {
      const TestComponent = () => {
        const { data, updateData } = useWizardStep(initialData);
        return (
          <div>
            <span data-testid="name">{data.name}</span>
            <button onClick={() => updateData({ name: 'John' })}>
              Update Name
            </button>
          </div>
        );
      };

      const { getByTestId, getByText } = render(
        <WizardProvider initialData={initialData}>
          <TestComponent />
        </WizardProvider>
      );

      // Initial state
      expect(getByTestId('name')).toHaveTextContent('');

      // Update data
      act(() => {
        getByText('Update Name').click();
      });

      expect(getByTestId('name')).toHaveTextContent('John');
    });
  });

  describe('useWizardStep', () => {
    test('validates data correctly', () => {
      const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <WizardProvider 
          initialData={{ name: '', age: 0 }} 
          validationSchema={TestSchema}
        >
          {children}
        </WizardProvider>
      );

      const { result } = renderHook(() => 
        useWizardStep<TestData>({ name: '', age: 0 }),
        { wrapper: Wrapper }
      );

      // Invalid data
      act(() => {
        result.current.updateData({ name: 'A', age: 17 });
        result.current.validateStep();
      });

      expect(result.current.errors).toEqual({
        name: "Name must be at least 2 characters",
        age: "Must be at least 18 years old"
      });

      // Valid data
      act(() => {
        result.current.updateData({ name: 'John Doe', age: 25 });
      });

      act(() => {
        const isValid = result.current.validateStep();
        expect(isValid).toBe(true);
      });

      expect(result.current.errors).toEqual({});
    });

    test('throws error when used outside WizardProvider', () => {
      const TestComponent = () => {
        try {
          useWizardStep({ name: '', age: 0 });
          return <div>Should not render</div>;
        } catch (error) {
          return <div data-testid="error-message">{(error as Error).message}</div>;
        }
      };

      const { getByTestId } = render(<TestComponent />);
      
      expect(getByTestId('error-message')).toHaveTextContent(
        'useWizardStep must be used within a WizardProvider'
      );
    });
  });

  describe('VendorWizard Component', () => {
    test('renders children in a container', () => {
      const { getByTestId } = render(
        <VendorWizard>
          <div data-testid="wizard-content">Wizard Content</div>
        </VendorWizard>
      );

      const container = getByTestId('wizard-content');
      expect(container).toBeInTheDocument();
      expect(container.closest('.vendor-wizard-container')).toBeInTheDocument();
    });
  });
}); 