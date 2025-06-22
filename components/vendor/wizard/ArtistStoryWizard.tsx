'use client';

import React, { useState, useCallback } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InstagramImageUpload } from '@/components/ui/instagram-image-upload';
import { createClient } from '@/lib/supabase/client';
import { HashtagInput } from '@/components/ui/hashtag-input';
import { MapPin } from 'lucide-react';

const ArtistStorySchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must be 100 characters or less"),
  story: z.string().min(50, "Story must be at least 50 characters").max(1000, "Story must be 1000 characters or less"),
  images: z.array(z.string()).max(5, "Maximum 5 images allowed"),
  hashtags: z.array(z.string()).max(10, "Maximum 10 hashtags allowed"),
  location: z.string().optional()
});

type ArtistStoryData = z.infer<typeof ArtistStorySchema>;

export const ArtistStoryWizard: React.FC = () => {
  const [storyData, setStoryData] = useState<ArtistStoryData>({
    title: '',
    story: '',
    images: [],
    hashtags: [],
    location: ''
  });

  const [characterCount, setCharacterCount] = useState({
    title: 0,
    story: 0
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);

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

  const handleImageUpload = useCallback((imageUrls: string[]) => {
    setStoryData(prev => ({
      ...prev,
      images: imageUrls
    }));
  }, []);

  const handleHashtagChange = useCallback((hashtags: string[]) => {
    setStoryData(prev => ({
      ...prev,
      hashtags
    }));
  }, []);

  const handleLocationSelect = useCallback((location: string) => {
    setStoryData(prev => ({
      ...prev,
      location
    }));
    setLocationModalOpen(false);
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
          images: storyData.images,
          hashtags: storyData.hashtags,
          location: storyData.location
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
        images: [],
        hashtags: [],
        location: ''
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
      <Card className="w-full max-w-2xl mx-auto instagram-post-preview">
        <CardHeader>
          <CardTitle>Story Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {storyData.images.length > 0 && (
              <div className="w-full aspect-square overflow-hidden relative">
                <img 
                  src={storyData.images[0]} 
                  alt="Story Preview" 
                  className="w-full h-full object-cover"
                />
                {storyData.images.length > 1 && (
                  <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded-full">
                    +{storyData.images.length - 1}
                  </div>
                )}
              </div>
            )}
            
            <div className="p-4">
              <h2 className="text-xl font-bold mb-2">{storyData.title}</h2>
              
              {storyData.location && (
                <div className="text-sm text-muted-foreground flex items-center mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  {storyData.location}
                </div>
              )}
              
              <p className="text-muted-foreground mb-2">{storyData.story}</p>
              
              {storyData.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {storyData.hashtags.map(tag => (
                    <span 
                      key={tag} 
                      className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 flex space-x-2">
            <Button variant="outline" onClick={togglePreview}>
              Edit Story
            </Button>
            <Button onClick={handleSubmit}>
              Share Story
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
          <InstagramImageUpload 
            onUploadComplete={handleImageUpload}
            maxImages={5}
            aspectRatio={1}
          />

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

          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setLocationModalOpen(true)}
            >
              <MapPin className="w-4 h-4 mr-2" /> 
              {storyData.location ? `📍 ${storyData.location}` : 'Add Location'}
            </Button>
          </div>

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

          <HashtagInput 
            onHashtagsChange={handleHashtagChange}
            maxHashtags={10}
          />

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
                storyData.story.length < 50 ||
                storyData.images.length === 0
              }
            >
              Share Story
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 