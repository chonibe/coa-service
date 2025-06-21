'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle } from 'lucide-react';

type OnboardingTooltipProps = {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export const OnboardingTooltip: React.FC<OnboardingTooltipProps> = ({
  id,
  title,
  description,
  children
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);

  useEffect(() => {
    // Check if tooltip has been shown before
    const tooltipShown = localStorage.getItem(`tooltip-${id}-shown`);
    setHasBeenShown(!!tooltipShown);
  }, [id]);

  const handleShowTooltip = () => {
    setIsVisible(true);
  };

  const handleCloseTooltip = () => {
    setIsVisible(false);
    // Mark tooltip as shown
    localStorage.setItem(`tooltip-${id}-shown`, 'true');
    setHasBeenShown(true);
  };

  return (
    <div className="relative inline-block">
      <div className="flex items-center">
        {children}
        {!hasBeenShown && (
          <button 
            onClick={handleShowTooltip}
            className="ml-2 text-blue-500 hover:text-blue-700"
            aria-label="Show onboarding tooltip"
          >
            <HelpCircle size={20} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full relative"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
            >
              <button
                onClick={handleCloseTooltip}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                aria-label="Close tooltip"
              >
                <X size={24} />
              </button>

              <h3 className="text-xl font-bold mb-4 text-gray-800">{title}</h3>
              <p className="text-gray-600 mb-6">{description}</p>

              <div className="flex justify-end">
                <button
                  onClick={handleCloseTooltip}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OnboardingTooltip; 