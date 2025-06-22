'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Button } from './button';
import { toast } from './use-toast';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type ImageUploadProps = {
  onUploadComplete: (imageUrl: string) => void;
  label?: string;
  maxSize?: number; // in MB
  aspectRatio?: 'square' | 'landscape' | 'portrait';
};

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onUploadComplete,
  label = 'Upload Image',
  maxSize = 5, // 5MB default
  aspectRatio = 'square'
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: `Please upload an image smaller than ${maxSize}MB`,
        variant: 'destructive'
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setIsUploading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `content-uploads/${fileName}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('vendor-content')
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('vendor-content')
        .getPublicUrl(filePath);

      onUploadComplete(publicUrl);

      toast({
        title: 'Image Uploaded',
        description: 'Your image has been successfully uploaded',
        variant: 'default'
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Unable to upload image',
        variant: 'destructive'
      });
      setPreviewImage(null);
    } finally {
      setIsUploading(false);
    }
  }, [maxSize, onUploadComplete]);

  const handleRemoveImage = () => {
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const aspectRatioClasses = {
    square: 'aspect-square',
    landscape: 'aspect-video',
    portrait: 'aspect-[9/16]'
  };

  return (
    <div className="space-y-2">
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      {previewImage ? (
        <div className="relative">
          <div className={cn(
            'w-full rounded-lg overflow-hidden',
            aspectRatioClasses[aspectRatio]
          )}>
            <Image 
              src={previewImage} 
              alt="Preview" 
              fill
              className="object-cover"
            />
          </div>
          <div className="mt-2 flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleRemoveImage}
              disabled={isUploading}
            >
              Remove
            </Button>
            <Button 
              onClick={handleFileSelect}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Change Image'}
            </Button>
          </div>
        </div>
      ) : (
        <Button 
          variant="outline" 
          onClick={handleFileSelect}
          className="w-full"
        >
          {label}
        </Button>
      )}
    </div>
  );
}; 