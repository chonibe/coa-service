import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import OnboardingTooltip from './OnboardingTooltip';

describe('OnboardingTooltip', () => {
  const mockProps = {
    id: 'test-tooltip',
    title: 'Test Tooltip',
    description: 'This is a test tooltip description',
    children: <div>Test Child</div>
  };

  beforeEach(() => {
    jest.spyOn(Storage.prototype, 'setItem');
    jest.spyOn(Storage.prototype, 'getItem');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders children and help icon when tooltip not shown', () => {
    render(<OnboardingTooltip {...mockProps} />);
    
    // Check child content
    expect(screen.getByText('Test Child')).toBeInTheDocument();
    
    // Check help icon
    const helpIcon = screen.getByLabelText('Show onboarding tooltip');
    expect(helpIcon).toBeInTheDocument();
  });

  test('shows tooltip when help icon is clicked', () => {
    render(<OnboardingTooltip {...mockProps} />);
    
    const helpIcon = screen.getByLabelText('Show onboarding tooltip');
    fireEvent.click(helpIcon);

    // Check tooltip content
    expect(screen.getByText('Test Tooltip')).toBeInTheDocument();
    expect(screen.getByText('This is a test tooltip description')).toBeInTheDocument();
  });

  test('closes tooltip and marks as shown when "Got It" is clicked', () => {
    render(<OnboardingTooltip {...mockProps} />);
    
    const helpIcon = screen.getByLabelText('Show onboarding tooltip');
    fireEvent.click(helpIcon);

    const gotItButton = screen.getByText('Got It');
    fireEvent.click(gotItButton);

    // Check localStorage
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'tooltip-test-tooltip-shown', 
      'true'
    );

    // Help icon should no longer be present
    expect(screen.queryByLabelText('Show onboarding tooltip')).not.toBeInTheDocument();
  });

  test('does not show help icon after tooltip has been shown', () => {
    // Simulate previous tooltip display
    localStorage.setItem('tooltip-test-tooltip-shown', 'true');

    render(<OnboardingTooltip {...mockProps} />);
    
    // Help icon should not be present
    expect(screen.queryByLabelText('Show onboarding tooltip')).not.toBeInTheDocument();
  });
}); 