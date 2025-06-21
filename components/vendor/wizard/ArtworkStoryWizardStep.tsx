'use client';

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useWizardStep } from './VendorWizard';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

const ArtworkStorySchema = z.object({
  productId: z.string().uuid("Please select a product"),
  story: z.string().min(50, "Story must be at least 50 characters").max(1000, "Story must be 1000 characters or less")
});

type ArtworkStoryWizardStepProps = {
  onNext: () => void;
  onPrevious?: () => void;
  onComplete: () => void;
};

export const ArtworkStoryWizardStep: React.FC<ArtworkStoryWizardStepProps> = ({ 
  onNext, 
  onPrevious, 
  onComplete 
}) => {
  const { data, errors, updateData, validateStep } = useWizardStep({
    productId: '',
    story: ''
  });

  const [products, setProducts] = useState<Array<{id: string, name: string}>>([]);
  const [characterCount, setCharacterCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/vendor/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        
        const fetchedProducts = await response.json();
        setProducts(fetchedProducts);
        setIsLoading(false);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Could not load products. Please try again.',
          variant: 'destructive'
        });
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleProductChange = (productId: string) => {
    updateData({ productId });
  };

  const handleStoryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const storyText = e.target.value;
    updateData({ story: storyText });
    setCharacterCount(storyText.length);
  };

  const handleSubmit = async () => {
    try {
      // Validate using Zod schema
      ArtworkStorySchema.parse(data);

      // API call to save artwork story
      const response = await fetch('/api/vendor/update-artwork-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          product_id: data.productId,
          artwork_story: data.story 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save artwork story');
      }

      // Mark step as complete and proceed
      onComplete();
      onNext();

      toast({
        title: 'Artwork Story Updated',
        description: 'Your artwork story has been successfully saved.',
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
          description: 'Unable to save your artwork story. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

  if (isLoading) {
    return <div>Loading products...</div>;
  }

  return (
    <div className="artwork-story-wizard-step space-y-4">
      <h2 className="text-2xl font-bold">Share Your Artwork's Story</h2>
      <p className="text-muted-foreground">
        Tell us about the inspiration, process, and meaning behind your artwork.
      </p>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Select Product</label>
        <Select 
          onValueChange={handleProductChange}
          value={data.productId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a product" />
          </SelectTrigger>
          <SelectContent>
            {products.map(product => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.productId && (
          <p className="text-destructive text-sm">{errors.productId}</p>
        )}
      </div>

      <Textarea 
        value={data.story}
        onChange={handleStoryChange}
        placeholder="Write your artwork story here (50-1000 characters)"
        className="w-full min-h-[200px]"
        maxLength={1000}
      />

      <div className="flex justify-between text-sm text-muted-foreground">
        <span>
          {characterCount}/1000 characters
        </span>
        {errors.story && (
          <span className="text-destructive">{errors.story}</span>
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
          disabled={
            characterCount < 50 || 
            characterCount > 1000 || 
            !data.productId
          }
        >
          Save & Continue
        </Button>
      </div>
    </div>
  );
};

export default ArtworkStoryWizardStep; 