'use client';

import React, { useState, useCallback } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/ui/image-upload';
import { createClient } from '@/lib/supabase/client';

const ArtistStorySchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must be 100 characters or less"),
  story: z.string().min(50, "Story must be at least 50 characters").max(1000, "Story must be 1000 characters or less"),
  imageUrl: z.string().optional()
});

type ArtistStoryData = z.infer<typeof ArtistStorySchema>;

export const ArtistStoryWizard: React.FC = () => {
  const [storyData, setStoryData] = useState<ArtistStoryData>({
    title: '',
    story: '',
    imageUrl: ''
  });

  const [characterCount, setCharacterCount] = useState({
    title: 0,
    story: 0
  });

  const [previewMode, setPreviewMode] = useState(false);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setStoryData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (name === 'title') {
      setCharacterCount(prev => ({ ...prev, title: value.length }));
    } else if (name === 'story') {
      setCharacterCount(prev => ({ ...prev, story: value.length }));
    }
  }, []);

  const handleImageUpload = useCallback((imageUrl: string) => {
    setStoryData(prev => ({
      ...prev,
      imageUrl
    }));
  }, []);

  const handleSubmit = async () => {
    try {
      // Validate using Zod schema
      ArtistStorySchema.parse(storyData);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('artist_stories')
        .insert({
          vendor_id: user.id,
          title: storyData.title,
          story: storyData.story,
          image_url: storyData.imageUrl
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Story Created',
        description: 'Your artist story has been successfully saved.',
        variant: 'default'
      });

      // Reset form
      setStoryData({
        title: '',
        story: '',
        imageUrl: ''
      });
      setCharacterCount({ title: 0, story: 0 });

    } catch (error) {
      console.error('Story submission error:', error);
      toast({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'Unable to save your story',
        variant: 'destructive'
      });
    }
  };

  const togglePreview = () => {
    setPreviewMode(!previewMode);
  };

  if (previewMode) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Story Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {storyData.imageUrl && (
            <img 
              src={storyData.imageUrl} 
              alt="Story Preview" 
              className="w-full h-64 object-cover rounded-lg mb-4"
            />
          )}
          <h2 className="text-2xl font-bold mb-2">{storyData.title}</h2>
          <p className="text-muted-foreground">{storyData.story}</p>
          <div className="mt-4 flex space-x-2">
            <Button variant="outline" onClick={togglePreview}>
              Edit Story
            </Button>
            <Button onClick={handleSubmit}>
              Save Story
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Your Artist Story</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Input 
              name="title"
              value={storyData.title}
              onChange={handleInputChange}
              placeholder="Story Title (5-100 characters)"
              maxLength={100}
            />
            <span className="text-sm text-muted-foreground">
              {characterCount.title}/100 characters
            </span>
          </div>

          <ImageUpload 
            onUploadComplete={handleImageUpload}
            label="Upload Story Image (Optional)"
          />

          <Textarea 
            name="story"
            value={storyData.story}
            onChange={handleInputChange}
            placeholder="Share your artistic journey (50-1000 characters)"
            className="min-h-[200px]"
            maxLength={1000}
          />
          <span className="text-sm text-muted-foreground">
            {characterCount.story}/1000 characters
          </span>

          <div className="flex space-x-4">
            <Button 
              variant="outline"
              onClick={togglePreview}
              disabled={
                storyData.title.length < 5 || 
                storyData.story.length < 50
              }
            >
              Preview Story
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={
                storyData.title.length < 5 || 
                storyData.story.length < 50
              }
            >
              Save Story
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 