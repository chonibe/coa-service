'use client';

import { useState, useCallback, useRef } from 'react';

type PerformanceMetric = {
  startTime: number;
  endTime?: number;
  duration?: number;
  stepName: string;
};

export function useWizardPerformanceTracking() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const currentStepRef = useRef<PerformanceMetric | null>(null);

  const startStepTracking = useCallback((stepName: string) => {
    // End previous step if exists
    if (currentStepRef.current) {
      endStepTracking();
    }

    const newStep: PerformanceMetric = {
      startTime: performance.now(),
      stepName
    };

    currentStepRef.current = newStep;
  }, []);

  const endStepTracking = useCallback(() => {
    if (currentStepRef.current) {
      const endTime = performance.now();
      const completedStep: PerformanceMetric = {
        ...currentStepRef.current,
        endTime,
        duration: endTime - currentStepRef.current.startTime
      };

      setMetrics(prev => [...prev, completedStep]);
      currentStepRef.current = null;
    }
  }, []);

  const getStepPerformance = useCallback((stepName: string) => {
    return metrics.find(metric => metric.stepName === stepName);
  }, [metrics]);

  const getTotalWizardDuration = useCallback(() => {
    const firstStep = metrics[0];
    const lastStep = metrics[metrics.length - 1];

    return firstStep && lastStep 
      ? lastStep.endTime! - firstStep.startTime 
      : 0;
  }, [metrics]);

  const reportPerformance = useCallback(() => {
    // Optional: Send performance data to analytics service
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track('Vendor Wizard Performance', {
        steps: metrics.map(m => ({
          name: m.stepName,
          duration: m.duration
        })),
        totalDuration: getTotalWizardDuration()
      });
    }
  }, [metrics, getTotalWizardDuration]);

  return {
    startStepTracking,
    endStepTracking,
    getStepPerformance,
    getTotalWizardDuration,
    reportPerformance,
    metrics
  };
}

// Server-side performance logging
export async function logWizardPerformance(
  vendorId: string, 
  metrics: PerformanceMetric[]
) {
  try {
    const response = await fetch('/api/vendor/log-performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        vendorId,
        metrics,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      console.error('Failed to log performance metrics');
    }
  } catch (error) {
    console.error('Performance logging error:', error);
  }
} 