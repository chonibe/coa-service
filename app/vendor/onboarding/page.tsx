"use client"

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, CheckCircle, Star, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SocialStoryCreator } from '@/components/vendor/SocialStoryCreator';

export default function VendorOnboardingPage() {
  const [completedSteps, setCompletedSteps] = useState({
    profile: false,
    bio: false,
    firstProduct: false,
    socialStory: false
  });

  const [currentStep, setCurrentStep] = useState(0);

  const onboardingSteps = [
    {
      title: 'Create Your Profile',
      description: 'Upload a profile picture and set up your vendor details',
      icon: <Award className="w-12 h-12 text-primary" />,
      component: () => (
        <div className="text-center">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            id="profile-upload"
          />
          <label 
            htmlFor="profile-upload" 
            className="cursor-pointer inline-block"
          >
            <div className="w-32 h-32 mx-auto rounded-full bg-gray-200 flex items-center justify-center">
              <Upload className="w-12 h-12 text-gray-500" />
            </div>
          </label>
          <p className="mt-4 text-sm text-gray-600">Click to upload profile picture</p>
        </div>
      )
    },
    {
      title: 'Write Your Artist Bio',
      description: 'Share your artistic journey and inspiration',
      icon: <Star className="w-12 h-12 text-yellow-500" />,
      component: () => (
        <textarea 
          placeholder="Tell us about your artistic journey..." 
          className="w-full min-h-[200px] p-4 border rounded"
        />
      )
    },
    {
      title: 'Add Your First Product',
      description: 'Upload an artwork and set its details',
      icon: <CheckCircle className="w-12 h-12 text-green-500" />,
      component: () => (
        <div>
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            id="product-upload"
          />
          <label 
            htmlFor="product-upload" 
            className="cursor-pointer block"
          >
            <div className="w-full h-64 border-2 border-dashed rounded-lg flex items-center justify-center">
              <Upload className="w-12 h-12 text-gray-500" />
              <span className="ml-4">Upload Product Image</span>
            </div>
          </label>
        </div>
      )
    },
    {
      title: 'Create Your Social Story',
      description: 'Share the inspiration behind your artwork',
      icon: <Star className="w-12 h-12 text-purple-500" />,
      component: () => (
        <SocialStoryCreator 
          productId="first-product" 
          onSubmit={() => {
            // Handle story submission
            setCompletedSteps(prev => ({...prev, socialStory: true}));
          }} 
        />
      )
    }
  ];

  const handleNextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const calculateProgress = () => {
    return (currentStep + 1) / onboardingSteps.length * 100;
  };

  const CurrentStepComponent = onboardingSteps[currentStep].component;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Welcome to Street Collector</h1>
          <Progress value={calculateProgress()} className="w-full mb-4" />
          
          <div className="flex justify-center space-x-4 mb-8">
            {onboardingSteps.map((step, index) => (
              <div 
                key={index} 
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center 
                  ${index <= currentStep ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}
                `}
              >
                {React.cloneElement(step.icon, { 
                  className: `w-6 h-6 ${index <= currentStep ? 'text-white' : 'text-gray-500'}` 
                })}
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-semibold mb-2">
            {onboardingSteps[currentStep].title}
          </h2>
          <p className="text-gray-600 mb-6">
            {onboardingSteps[currentStep].description}
          </p>
        </div>

        <div className="mb-8">
          <CurrentStepComponent />
        </div>

        <div className="flex justify-between">
          {currentStep > 0 && (
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              Previous
            </Button>
          )}
          
          {currentStep < onboardingSteps.length - 1 ? (
            <Button 
              onClick={handleNextStep}
              className="ml-auto"
            >
              Next Step
            </Button>
          ) : (
            <Button 
              variant="default" 
              className="ml-auto"
            >
              Complete Onboarding
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
