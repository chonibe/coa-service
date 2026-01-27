// app/vendor/dashboard/artwork-pages/components/InspirationBoardEditor.tsx
import React, { useState, useCallback } from 'react';
import { Input, Button } from '@/components/ui';
import { ImageIcon, Plus, Trash2, Loader2, Upload } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/components/ui/use-toast';
import { type MediaItem, MediaLibraryModal } from '@/components/vendor/MediaLibraryModal';

interface InspirationImage {
  url: string;
  caption?: string;
  id?: string; // Optional ID for existing images
}

interface InspirationBoardEditorProps {
  story?: string;
  images: InspirationImage[];
  onUpdate: (updates: { story?: string; images: InspirationImage[] }) => void;
  onFileUpload: (file: File, blockType: string) => Promise<string>; // Should return the URL
}

const InspirationBoardEditor: React.FC<InspirationBoardEditorProps> = ({
  story: initialStory,
  images: initialImages,
  onUpdate,
  onFileUpload,
}) => {
  const [story, setStory] = useState(initialStory);
  const [currentImages, setCurrentImages] = useState(initialImages);
  const [uploadingImageIds, setUploadingImageIds] = useState<Set<string>>(new Set());
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const { toast } = useToast();

  const handleStoryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newStory = e.target.value;
    setStory(newStory);
    onUpdate({ story: newStory, images: currentImages });
  };

  const handleImageUpload = useCallback(async (file: File) => {
    const tempId = `temp-${Date.now()}`;
    setUploadingImageIds((prev) => new Set(prev).add(tempId));

    try {
      const imageUrl = await onFileUpload(file, 'image');
      const newImage: InspirationImage = {
        url: imageUrl,
        caption: '',
        id: `img-${Date.now()}`,
      };
      const updatedImages = [...currentImages, newImage];
      setCurrentImages(updatedImages);
      onUpdate({ story, images: updatedImages });
      toast({ title: 'Image Uploaded', description: 'Image added to inspiration board.' });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: 'Upload Failed', description: 'Failed to upload image.', variant: 'destructive' });
    } finally {
      setUploadingImageIds((prev) => { const next = new Set(prev); next.delete(tempId); return next; });
    }
  }, [story, currentImages, onUpdate, onFileUpload, toast]);

  const handleMediaLibrarySelect = useCallback(async (media: MediaItem | MediaItem[]) => {
    const selectedMedia = Array.isArray(media) ? media[0] : media;
    if (selectedMedia) {
      const newImage: InspirationImage = {
        url: selectedMedia.url,
        caption: '',
        id: `img-${Date.now()}`,
      };
      const updatedImages = [...currentImages, newImage];
      setCurrentImages(updatedImages);
      onUpdate({ story, images: updatedImages });
      toast({ title: 'Media Selected', description: 'Image added from library.' });
    }
    setShowMediaLibrary(false);
  }, [story, currentImages, onUpdate, toast]);

  const handleImageRemove = useCallback((idToRemove: string) => {
    const updatedImages = currentImages.filter((img) => img.id !== idToRemove);
    setCurrentImages(updatedImages);
    onUpdate({ story, images: updatedImages });
  }, [story, currentImages, onUpdate]);

  const handleImageCaptionChange = useCallback((idToUpdate: string, newCaption: string) => {
    const updatedImages = currentImages.map((img) =>
      img.id === idToUpdate ? { ...img, caption: newCaption } : img
    );
    setCurrentImages(updatedImages);
    onUpdate({ story, images: updatedImages });
  }, [story, currentImages, onUpdate]);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Story (optional)</label>
        <textarea
          value={story || ''}
          onChange={handleStoryChange}
          placeholder="What inspired this work? Share references, mood images, or visual influences"
          rows={3}
          className="w-full p-3 bg-gray-700 rounded-md text-gray-200 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-300">Images</label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentImages.map((image, index) => (
            <div
              key={image.id || image.url} // Use id if available, fallback to url
              className="relative bg-gray-800 rounded-lg overflow-hidden shadow-md group"
            >
              <div className="relative w-full aspect-square">
                <Image
                  src={image.url}
                  alt={image.caption || `Inspiration image ${index + 1}`}
                  layout="fill"
                  objectFit="cover"
                />
              </div>
              <div className="p-3 space-y-2">
                <Input
                  type="text"
                  placeholder="Caption (optional)"
                  value={image.caption || ''}
                  onChange={(e) => handleImageCaptionChange(image.id || image.url, e.target.value)}
                  className="w-full bg-gray-700 border-gray-600 text-white text-sm"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleImageRemove(image.id || image.url)}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Remove
                </Button>
              </div>
            </div>
          ))}

          {uploadingImageIds.size > 0 && Array.from(uploadingImageIds).map(tempId => (
            <div key={tempId} className="relative bg-gray-800 rounded-lg p-4 flex flex-col items-center justify-center aspect-square border border-dashed border-gray-600">
              <Loader2 className="h-8 w-8 text-gray-400 animate-spin mb-2" />
              <p className="text-sm text-gray-400">Uploading...</p>
            </div>
          ))}

          <div className="flex flex-col space-y-2">
            <Button
              variant="outline"
              className="flex-1 h-24 border-dashed border-gray-600 text-gray-400 hover:border-solid hover:border-green-500 hover:text-green-400"
              onClick={() => setShowMediaLibrary(true)}
            >
              <ImageIcon className="h-5 w-5 mr-2" /> Choose from Library
            </Button>
            <Input
              id="inspiration-image-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  Array.from(e.target.files).forEach(file => handleImageUpload(file));
                  e.target.value = ''; // Reset input
                }
              }}
              className="hidden"
            />
            <Button
              variant="outline"
              className="flex-1 h-24 border-dashed border-gray-600 text-gray-400 hover:border-solid hover:border-green-500 hover:text-green-400"
              onClick={() => document.getElementById('inspiration-image-upload')?.click()}
            >
              <Upload className="h-5 w-5 mr-2" /> Upload Images
            </Button>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-1">💡 Tip: What influenced this work? Photos, screenshots, textures - help collectors see through your eyes.</p>

      <MediaLibraryModal
        open={showMediaLibrary}
        onOpenChange={setShowMediaLibrary}
        onSelect={handleMediaLibrarySelect}
        mode="multiple"
        allowedTypes={['image']}
        title="Select Media for Inspiration Board"
      />
    </div>
  );
};

export default InspirationBoardEditor;
