'use client';

import React, { useState } from 'react';
import { z } from 'zod';
import { useWizardStep } from './VendorWizard';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import OnboardingTooltip from '@/components/vendor/OnboardingTooltip';

const BioSchema = z.object({
  bio: z.string().min(50, "Bio must be at least 50 characters").max(500, "Bio must be 500 characters or less")
});

type BioWizardStepProps = {
  onNext: () => void;
  onPrevious?: () => void;
  onComplete: () => void;
};

export const BioWizardStep: React.FC<BioWizardStepProps> = ({ 
  onNext, 
  onPrevious, 
  onComplete 
}) => {
  const { data, errors, updateData, validateStep } = useWizardStep({
    bio: ''
  });

  const [characterCount, setCharacterCount] = useState(0);

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const bioText = e.target.value;
    updateData({ bio: bioText });
    setCharacterCount(bioText.length);
  };

  const handleSubmit = async () => {
    try {
      // Validate using Zod schema
      BioSchema.parse(data);

      // API call to save bio
      const response = await fetch('/api/vendor/update-bio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bio: data.bio })
      });

      if (!response.ok) {
        throw new Error('Failed to save bio');
      }

      // Mark step as complete and proceed
      onComplete();
      onNext();

      toast({
        title: 'Bio Updated',
        description: 'Your artist bio has been successfully saved.',
        variant: 'default'
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors.map(e => e.message).join(', '),
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Save Failed',
          description: 'Unable to save your bio. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

  return (
    <div className="bio-wizard-step space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Tell Us About Yourself</h2>
        <OnboardingTooltip
          id="vendor-bio-tooltip"
          title="Crafting Your Artist Bio"
          description="Share your unique artistic journey. Highlight your inspirations, techniques, and what makes your art special. A compelling bio helps collectors connect with you personally."
        >
          <span>Bio Writing Tips</span>
        </OnboardingTooltip>
      </div>
      
      <p className="text-muted-foreground">
        Share your artistic journey, inspirations, and what makes you unique.
      </p>

      <Textarea 
        value={data.bio}
        onChange={handleBioChange}
        placeholder="Write your artist bio here (50-500 characters)"
        className="w-full min-h-[200px]"
        maxLength={500}
      />

      <div className="flex justify-between text-sm text-muted-foreground">
        <span>
          {characterCount}/500 characters
        </span>
        {errors.bio && (
          <span className="text-destructive">{errors.bio}</span>
        )}
      </div>

      <div className="flex space-x-4">
        {onPrevious && (
          <Button 
            variant="outline" 
            onClick={onPrevious}
          >
            Back
          </Button>
        )}
        <Button 
          onClick={handleSubmit}
          disabled={characterCount < 50 || characterCount > 500}
        >
          Save & Continue
        </Button>
      </div>
    </div>
  );
};

export default BioWizardStep; 