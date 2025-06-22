'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Button } from './button';
import { X, ImagePlus, Crop, Maximize2 } from 'lucide-react';
import { toast } from './use-toast';
import Cropper from 'react-easy-crop';
import { Point, Area } from 'react-easy-crop/types';

type InstagramImageUploadProps = {
  onUploadComplete: (imageUrls: string[]) => void;
  maxImages?: number;
  aspectRatio?: number;
};

export const InstagramImageUpload: React.FC<InstagramImageUploadProps> = ({
  onUploadComplete,
  maxImages = 5,
  aspectRatio = 1
}) => {
  const [images, setImages] = useState<string[]>([]);
  const [currentCropImage, setCurrentCropImage] = useState<{
    url: string;
    index: number;
  } | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const validImageFiles = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .slice(0, maxImages - images.length);

    const newImageUrls = validImageFiles.map(file => URL.createObjectURL(file));

    setImages(prev => [...prev, ...newImageUrls]);

    if (validImageFiles.length < files.length) {
      toast({
        title: 'Image Limit Reached',
        description: `You can only upload up to ${maxImages} images.`,
        variant: 'destructive'
      });
    }
  }, [images, maxImages]);

  const removeImage = useCallback((indexToRemove: number) => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
  }, []);

  const startCropping = useCallback((imageUrl: string, index: number) => {
    setCurrentCropImage({ url: imageUrl, index });
  }, []);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const saveCroppedImage = useCallback(async () => {
    if (!currentCropImage || !croppedAreaPixels) return;

    try {
      // Here you would typically call your image cropping/upload service
      // For now, we'll just update the image
      const croppedImageUrl = await getCroppedImg(
        currentCropImage.url, 
        croppedAreaPixels
      );

      setImages(prev => 
        prev.map((img, index) => 
          index === currentCropImage.index ? croppedImageUrl : img
        )
      );

      setCurrentCropImage(null);
    } catch (error) {
      toast({
        title: 'Crop Failed',
        description: 'Unable to crop the image.',
        variant: 'destructive'
      });
    }
  }, [currentCropImage, croppedAreaPixels]);

  // Placeholder for actual image cropping logic
  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<string> => {
    // Implement actual cropping logic here
    return imageSrc;
  };

  return (
    <div className="instagram-image-upload space-y-4">
      {currentCropImage ? (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-lg p-4">
            <button 
              onClick={() => setCurrentCropImage(null)}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="relative w-full h-[500px]">
              <Cropper
                image={currentCropImage.url}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setCurrentCropImage(null)}>
                Cancel
              </Button>
              <Button onClick={saveCroppedImage}>
                Save Crop
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {images.map((imageUrl, index) => (
          <div 
            key={imageUrl} 
            className="relative w-24 h-24 rounded-lg overflow-hidden group"
          >
            <img 
              src={imageUrl} 
              alt={`Upload ${index + 1}`} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <button 
                onClick={() => removeImage(index)}
                className="text-white bg-red-500 rounded-full p-1 mr-2"
              >
                <X className="w-4 h-4" />
              </button>
              <button 
                onClick={() => startCropping(imageUrl, index)}
                className="text-white bg-blue-500 rounded-full p-1"
              >
                <Crop className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {images.length < maxImages && (
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-primary transition-colors"
          >
            <ImagePlus className="w-8 h-8 text-gray-400" />
          </button>
        )}
      </div>

      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        multiple
        className="hidden"
      />
    </div>
  );
}; 