'use client';

import React, { useState, useCallback } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/ui/image-upload';
import { createClient } from '@/lib/supabase/client';
import { 
  HashtagInput, 
  LocationInput, 
  MentionInput 
} from '@/components/ui/social-inputs';

const ArtistStorySchema = z.object({
  story: z.string().min(10, "Story must be at least 10 characters").max(2200, "Story must be 2200 characters or less"),
  imageUrl: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  location: z.string().optional(),
  mentions: z.array(z.string()).optional()
});

type ArtistStoryData = z.infer<typeof ArtistStorySchema>;

export const ArtistStoryWizard: React.FC = () => {
  const [storyData, setStoryData] = useState<ArtistStoryData>({
    story: '',
    imageUrl: '',
    hashtags: [],
    location: '',
    mentions: []
  });

  const [characterCount, setCharacterCount] = useState(0);

  const handleStoryChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const storyText = e.target.value;
    setStoryData(prev => ({
      ...prev,
      story: storyText
    }));
    setCharacterCount(storyText.length);
  }, []);

  const handleImageUpload = useCallback((imageUrl: string) => {
    setStoryData(prev => ({
      ...prev,
      imageUrl
    }));
  }, []);

  const handleHashtagsChange = useCallback((hashtags: string[]) => {
    setStoryData(prev => ({
      ...prev,
      hashtags
    }));
  }, []);

  const handleLocationChange = useCallback((location: string) => {
    setStoryData(prev => ({
      ...prev,
      location
    }));
  }, []);

  const handleMentionsChange = useCallback((mentions: string[]) => {
    setStoryData(prev => ({
      ...prev,
      mentions
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
          story: storyData.story,
          image_url: storyData.imageUrl,
          hashtags: storyData.hashtags,
          location: storyData.location,
          mentions: storyData.mentions
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Story Shared',
        description: 'Your artist story has been successfully published.',
        variant: 'default'
      });

      // Reset form
      setStoryData({
        story: '',
        imageUrl: '',
        hashtags: [],
        location: '',
        mentions: []
      });
      setCharacterCount(0);

    } catch (error) {
      console.error('Story submission error:', error);
      toast({
        title: 'Sharing Failed',
        description: error instanceof Error ? error.message : 'Unable to share your story',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Share Your Artist Story</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ImageUpload 
            onUploadComplete={handleImageUpload}
            label="Upload Story Image"
            aspectRatio="square"
          />

          <Textarea 
            value={storyData.story}
            onChange={handleStoryChange}
            placeholder="Tell your artistic story... (10-2200 characters)"
            className="min-h-[200px]"
            maxLength={2200}
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{characterCount}/2200 characters</span>
          </div>

          <div className="space-y-2">
            <HashtagInput 
              onHashtagsChange={handleHashtagsChange}
              placeholder="Add hashtags to your story"
            />
            <LocationInput 
              onLocationChange={handleLocationChange}
              placeholder="Add location"
            />
            <MentionInput 
              onMentionsChange={handleMentionsChange}
              placeholder="Mention other artists or collaborators"
            />
          </div>

          <Button 
            onClick={handleSubmit}
            className="w-full"
            disabled={
              storyData.story.length < 10 || 
              !storyData.imageUrl
            }
          >
            Share Story
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 