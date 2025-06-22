'use client';

import React, { useState, useCallback } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { InstagramImageUpload } from '@/components/ui/instagram-image-upload';
import { HashtagInput } from '@/components/ui/hashtag-input';
import { MapPin } from 'lucide-react';

const ProductBenefitSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be 100 characters or less"),
  description: z.string().min(20, "Description must be at least 20 characters").max(500, "Description must be 500 characters or less"),
  category: z.enum(['Artistic', 'Material', 'Emotional', 'Collector', 'Other']),
  images: z.array(z.string()).max(5, "Maximum 5 images allowed"),
  hashtags: z.array(z.string()).max(10, "Maximum 10 hashtags allowed"),
  location: z.string().optional()
});

type ProductBenefitData = z.infer<typeof ProductBenefitSchema>;

export const ProductBenefitWizard: React.FC = () => {
  const [benefitData, setBenefitData] = useState<ProductBenefitData>({
    title: '',
    description: '',
    category: 'Other',
    images: [],
    hashtags: [],
    location: ''
  });

  const [characterCount, setCharacterCount] = useState({
    title: 0,
    description: 0
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBenefitData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (name === 'title') {
      setCharacterCount(prev => ({ ...prev, title: value.length }));
    } else if (name === 'description') {
      setCharacterCount(prev => ({ ...prev, description: value.length }));
    }
  }, []);

  const handleImageUpload = useCallback((imageUrls: string[]) => {
    setBenefitData(prev => ({
      ...prev,
      images: imageUrls
    }));
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    setBenefitData(prev => ({
      ...prev,
      category: category as ProductBenefitData['category']
    }));
  }, []);

  const handleHashtagChange = useCallback((hashtags: string[]) => {
    setBenefitData(prev => ({
      ...prev,
      hashtags
    }));
  }, []);

  const handleLocationSelect = useCallback((location: string) => {
    setBenefitData(prev => ({
      ...prev,
      location
    }));
    setLocationModalOpen(false);
  }, []);

  const handleSubmit = async () => {
    try {
      // Validate using Zod schema
      ProductBenefitSchema.parse(benefitData);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('product_benefits')
        .insert({
          vendor_id: user.id,
          title: benefitData.title,
          description: benefitData.description,
          category: benefitData.category,
          images: benefitData.images,
          hashtags: benefitData.hashtags,
          location: benefitData.location
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Benefit Created',
        description: 'Your product benefit has been successfully saved.',
        variant: 'default'
      });

      // Reset form
      setBenefitData({
        title: '',
        description: '',
        category: 'Other',
        images: [],
        hashtags: [],
        location: ''
      });
      setCharacterCount({ title: 0, description: 0 });

    } catch (error) {
      console.error('Benefit submission error:', error);
      toast({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'Unable to save your benefit',
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
          <CardTitle>Product Benefit Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {benefitData.images.length > 0 && (
              <div className="w-full aspect-square overflow-hidden relative">
                <img 
                  src={benefitData.images[0]} 
                  alt="Benefit Preview" 
                  className="w-full h-full object-cover"
                />
                {benefitData.images.length > 1 && (
                  <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded-full">
                    +{benefitData.images.length - 1}
                  </div>
                )}
              </div>
            )}
            
            <div className="p-4">
              <h2 className="text-xl font-bold mb-2">{benefitData.title}</h2>
              
              {benefitData.location && (
                <div className="text-sm text-muted-foreground flex items-center mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  {benefitData.location}
                </div>
              )}
              
              <p className="text-muted-foreground mb-2">{benefitData.description}</p>
              
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-semibold text-primary/70 bg-primary/10 px-2 py-1 rounded">
                  {benefitData.category} Benefit
                </span>
              </div>
              
              {benefitData.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {benefitData.hashtags.map(tag => (
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
              Edit Benefit
            </Button>
            <Button onClick={handleSubmit}>
              Share Benefit
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Product Benefit</CardTitle>
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
            value={benefitData.title}
            onChange={handleInputChange}
            placeholder="Benefit Title (3-100 characters)"
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
              {benefitData.location ? `📍 ${benefitData.location}` : 'Add Location'}
            </Button>
          </div>

          <Select 
            value={benefitData.category} 
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Benefit Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Artistic">Artistic</SelectItem>
              <SelectItem value="Material">Material</SelectItem>
              <SelectItem value="Emotional">Emotional</SelectItem>
              <SelectItem value="Collector">Collector</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Textarea 
            name="description"
            value={benefitData.description}
            onChange={handleInputChange}
            placeholder="Describe the unique benefit of this product (20-500 characters)"
            className="min-h-[200px]"
            maxLength={500}
          />
          <span className="text-sm text-muted-foreground">
            {characterCount.description}/500 characters
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
                benefitData.title.length < 3 || 
                benefitData.description.length < 20
              }
            >
              Preview Benefit
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={
                benefitData.title.length < 3 || 
                benefitData.description.length < 20 ||
                benefitData.images.length === 0
              }
            >
              Share Benefit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 