'use client';

import React from 'react';
import VendorWizard, { WizardStep } from '@/components/vendor/wizard/VendorWizard';
import BioWizardStep from '@/components/vendor/wizard/BioWizardStep';
import ArtworkStoryWizardStep from '@/components/vendor/wizard/ArtworkStoryWizardStep';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';

export default function VendorWizardPage() {
  const router = useRouter();

  const wizardSteps: WizardStep[] = [
    {
      id: 'bio',
      title: 'Artist Bio',
      component: <BioWizardStep />,
      isComplete: false
    },
    {
      id: 'artwork-story',
      title: 'Artwork Story',
      component: <ArtworkStoryWizardStep />,
      isComplete: false
    }
  ];

  const handleWizardComplete = async () => {
    try {
      // Update vendor profile completion status
      const response = await fetch('/api/vendor/complete-profile', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to complete profile');
      }

      toast({
        title: 'Profile Completed',
        description: 'Your vendor profile is now complete!',
        variant: 'default'
      });

      // Redirect to dashboard
      router.push('/vendor/dashboard');

    } catch (error) {
      toast({
        title: 'Completion Error',
        description: 'Unable to complete profile. Please try again.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Complete Your Vendor Profile
        </h1>
        
        <VendorWizard 
          steps={wizardSteps} 
          onComplete={handleWizardComplete}
          className="vendor-profile-wizard"
        />
      </div>
    </div>
  );
} 