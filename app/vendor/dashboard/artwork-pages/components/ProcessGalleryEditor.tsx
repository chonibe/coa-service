// app/vendor/dashboard/artwork-pages/components/ProcessGalleryEditor.tsx
import React, { useState, useCallback } from 'react';
import { Input, Button } from '@/components/ui';
import { ImageIcon, Plus, Trash2, GripVertical, Loader2, Upload } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/components/ui/use-toast';
import { type MediaItem, MediaLibraryModal } from '@/components/vendor/MediaLibraryModal';

interface ProcessImage {
  url: string;
  caption?: string;
  order: number;
  id?: string; // Optional ID for existing images
}

interface ProcessGalleryEditorProps {
  intro?: string;
  images: ProcessImage[];
  onUpdate: (updates: { intro?: string; images: ProcessImage[] }) => void;
  onFileUpload: (file: File, blockType: string) => Promise<string>; // Should return the URL
}

const ProcessGalleryEditor: React.FC<ProcessGalleryEditorProps> = ({
  intro: initialIntro,
  images: initialImages,
  onUpdate,
  onFileUpload,
}) => {
  const [intro, setIntro] = useState(initialIntro);
  const [currentImages, setCurrentImages] = useState(initialImages.sort((a, b) => a.order - b.order));
  const [uploadingImageIds, setUploadingImageIds] = useState<Set<string>>(new Set());
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [currentImageEditId, setCurrentImageEditId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleIntroChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newIntro = e.target.value;
    setIntro(newIntro);
    onUpdate({ intro: newIntro, images: currentImages });
  };

  const handleImageUpload = useCallback(async (file: File) => {
    const tempId = `temp-${Date.now()}`;
    setUploadingImageIds((prev) => new Set(prev).add(tempId));

    try {
      const imageUrl = await onFileUpload(file, 'image');
      const newImage: ProcessImage = {
        url: imageUrl,
        caption: '',
        order: currentImages.length + 1,
        id: `img-${Date.now()}`,
      };
      const updatedImages = [...currentImages, newImage].sort((a, b) => a.order - b.order);
      setCurrentImages(updatedImages);
      onUpdate({ intro, images: updatedImages });
      toast({ title: 'Image Uploaded', description: 'Image added to gallery.' });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: 'Upload Failed', description: 'Failed to upload image.', variant: 'destructive' });
    } finally {
      setUploadingImageIds((prev) => { const next = new Set(prev); next.delete(tempId); return next; });
    }
  }, [intro, currentImages, onUpdate, onFileUpload, toast]);

  const handleMediaLibrarySelect = useCallback(async (media: MediaItem | MediaItem[]) => {
    const selectedMedia = Array.isArray(media) ? media[0] : media;
    if (selectedMedia) {
      const newImage: ProcessImage = {
        url: selectedMedia.url,
        caption: '',
        order: currentImages.length + 1,
        id: `img-${Date.now()}`,
      };
      const updatedImages = [...currentImages, newImage].sort((a, b) => a.order - b.order);
      setCurrentImages(updatedImages);
      onUpdate({ intro, images: updatedImages });
      toast({ title: 'Media Selected', description: 'Image added from library.' });
    }
    setShowMediaLibrary(false);
  }, [intro, currentImages, onUpdate, toast]);

  const handleImageRemove = useCallback((orderToRemove: number) => {
    const updatedImages = currentImages
      .filter((img) => img.order !== orderToRemove)
      .map((img, index) => ({ ...img, order: index + 1 })); // Re-order
    setCurrentImages(updatedImages);
    onUpdate({ intro, images: updatedImages });
  }, [intro, currentImages, onUpdate]);

  const handleImageCaptionChange = useCallback((orderToUpdate: number, newCaption: string) => {
    const updatedImages = currentImages.map((img) =>
      img.order === orderToUpdate ? { ...img, caption: newCaption } : img
    );
    setCurrentImages(updatedImages);
    onUpdate({ intro, images: updatedImages });
  }, [intro, currentImages, onUpdate]);

  // Drag and drop functionality
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Allow drop
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    const newImages = [...currentImages];
    const [draggedImage] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);

    const reorderedImages = newImages.map((img, index) => ({ ...img, order: index + 1 }));
    setCurrentImages(reorderedImages);
    onUpdate({ intro, images: reorderedImages });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Introduction (optional)</label>
        <textarea
          value={intro || ''}
          onChange={handleIntroChange}
          placeholder="This piece started as a quick sketch and evolved over several weeks..."
          rows={3}
          className="w-full p-3 bg-gray-700 rounded-md text-gray-200 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-300">Images (drag to reorder)</label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentImages.map((image, index) => (
            <div
              key={image.id || image.url} // Use id if available, fallback to url
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className="relative bg-gray-800 rounded-lg overflow-hidden shadow-md group"
            >
              <div className="relative w-full aspect-square">
                <Image
                  src={image.url}
                  alt={image.caption || `Process image ${index + 1}`}
                  layout="fill"
                  objectFit="cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="h-6 w-6 text-white cursor-grab" />
                </div>
              </div>
              <div className="p-3 space-y-2">
                <Input
                  type="text"
                  placeholder="Caption (optional)"
                  value={image.caption || ''}
                  onChange={(e) => handleImageCaptionChange(image.order, e.target.value)}
                  className="w-full bg-gray-700 border-gray-600 text-white text-sm"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleImageRemove(image.order)}
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
              onClick={() => setCurrentImageEditId(null) && setShowMediaLibrary(true)}
            >
              <ImageIcon className="h-5 w-5 mr-2" /> Choose from Library
            </Button>
            <Input
              id="process-image-upload"
              type="file"
              accept="image/*,video/*"
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
              onClick={() => document.getElementById('process-image-upload')?.click()}
            >
              <Upload className="h-5 w-5 mr-2" /> Upload Image/Video
            </Button>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-1">💡 Tip: Show the journey - early sketches, works in progress, and close-up details work great.</p>

      <MediaLibraryModal
        open={showMediaLibrary}
        onOpenChange={setShowMediaLibrary}
        onSelect={handleMediaLibrarySelect}
        mode="single"
        allowedTypes={['image', 'video']}
        title="Select Media for Process Gallery"
      />
    </div>
  );
};

export default ProcessGalleryEditor;
