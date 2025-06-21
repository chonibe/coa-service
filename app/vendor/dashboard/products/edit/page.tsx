'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';

// Validation schema
const ProductEditSchema = z.object({
  bio: z.string().max(500, "Bio must be 500 characters or less").optional(),
  artwork_story: z.string().max(1000, "Artwork story must be 1000 characters or less").optional(),
});

type ProductEditFormData = z.infer<typeof ProductEditSchema>;

export default function ProductEditPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<ProductEditFormData>({
    resolver: zodResolver(ProductEditSchema)
  });

  const onSubmit = useCallback(async (data: ProductEditFormData) => {
    setIsSubmitting(true);
    
    try {
      // Update Bio
      if (data.bio) {
        const bioResponse = await fetch('/api/vendor/update-bio', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ bio: data.bio })
        });

        if (!bioResponse.ok) {
          const errorData = await bioResponse.json();
          throw new Error(errorData.error || 'Failed to update bio');
        }
      }

      // Update Artwork Story
      if (data.artwork_story) {
        const storyResponse = await fetch('/api/vendor/update-artwork-story', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            product_id: 'CURRENT_PRODUCT_ID', // TODO: Replace with actual product ID
            artwork_story: data.artwork_story 
          })
        });

        if (!storyResponse.ok) {
          const errorData = await storyResponse.json();
          throw new Error(errorData.error || 'Failed to update artwork story');
        }
      }

      toast({
        title: 'Update Successful',
        description: 'Your bio and artwork story have been updated.',
        variant: 'default'
      });

    } catch (error) {
      console.error('Update Error:', error);
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Product Details</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
            Artist Bio (500 characters max)
          </label>
          <Textarea 
            {...register('bio')}
            placeholder="Tell us about yourself..."
            className="mt-1 block w-full"
            rows={4}
          />
          {errors.bio && (
            <p className="text-red-500 text-sm mt-1">{errors.bio.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="artwork_story" className="block text-sm font-medium text-gray-700">
            Artwork Story (1000 characters max)
          </label>
          <Textarea 
            {...register('artwork_story')}
            placeholder="Share the story behind your artwork..."
            className="mt-1 block w-full"
            rows={6}
          />
          {errors.artwork_story && (
            <p className="text-red-500 text-sm mt-1">{errors.artwork_story.message}</p>
          )}
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Updating...' : 'Save Changes'}
        </Button>
      </form>
    </div>
  );
} 