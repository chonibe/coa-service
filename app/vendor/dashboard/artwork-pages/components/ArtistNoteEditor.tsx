// app/vendor/dashboard/artwork-pages/components/ArtistNoteEditor.tsx
import React, { useState } from 'react';
import { Input, Button } from '@/components/ui';
import { Upload, ImageIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/components/ui/use-toast';
import { MediaLibraryModal, type MediaItem } from '@/components/vendor/MediaLibraryModal';

interface ArtistNoteEditorProps {
  content: string;
  signatureUrl?: string;
  onUpdate: (updates: { content?: string; signature_url?: string }) => void;
  onFileUpload: (file: File, blockType: string) => Promise<string>;
}

const ArtistNoteEditor: React.FC<ArtistNoteEditorProps> = ({
  content: initialContent,
  signatureUrl: initialSignatureUrl,
  onUpdate,
  onFileUpload,
}) => {
  const [content, setContent] = useState(initialContent);
  const [signatureUrl, setSignatureUrl] = useState(initialSignatureUrl);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const { toast } = useToast();

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    onUpdate({ content: newContent });
  };

  const handleSignatureUpload = async (file: File) => {
    setIsUploadingSignature(true);
    try {
      const url = await onFileUpload(file, 'image');
      setSignatureUrl(url);
      onUpdate({ signature_url: url });
      toast({ title: 'Signature Uploaded', description: 'Your signature image has been saved.' });
    } catch (error) {
      console.error('Error uploading signature:', error);
      toast({ title: 'Upload Failed', description: 'Failed to upload signature image.', variant: 'destructive' });
    } finally {
      setIsUploadingSignature(false);
    }
  };

  const handleMediaLibrarySelect = useCallback(async (media: MediaItem | MediaItem[]) => {
    const selectedMedia = Array.isArray(media) ? media[0] : media;
    if (selectedMedia) {
      setSignatureUrl(selectedMedia.url);
      onUpdate({ signature_url: selectedMedia.url });
      toast({ title: 'Media Selected', description: 'Signature image added from library.' });
    }
    setShowMediaLibrary(false);
  }, [onUpdate, toast]);

  const removeSignature = () => {
    setSignatureUrl(undefined);
    onUpdate({ signature_url: undefined });
    toast({ title: 'Signature Removed', description: 'Signature image has been removed.' });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Artist's Note Content</label>
        <textarea
          value={content || ''}
          onChange={handleContentChange}
          placeholder="Write from the heart. What does this piece mean to you? What should collectors know?"
          rows={8}
          className="w-full p-3 bg-gray-700 rounded-md text-gray-200 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Artist Signature (optional)</label>
        {signatureUrl ? (
          <div className="relative w-48 h-20 bg-gray-800 rounded-md p-2 flex items-center justify-center border border-gray-600">
            <Image src={signatureUrl} alt="Artist Signature" layout="fill" objectFit="contain" />
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-1 right-1 w-6 h-6 p-0 rounded-full"
              onClick={removeSignature}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col space-y-2">
            <Button
              variant="outline"
              className="flex-1 h-16 border-dashed border-gray-600 text-gray-400 hover:border-solid hover:border-green-500 hover:text-green-400"
              onClick={() => setShowMediaLibrary(true)}
            >
              <ImageIcon className="h-5 w-5 mr-2" /> Choose from Library
            </Button>
            <Input
              id="signature-upload"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleSignatureUpload(file);
                  e.target.value = '';
                }
              }}
              disabled={isUploadingSignature}
              className="hidden"
            />
            <Button
              variant="outline"
              className="flex-1 h-16 border-dashed border-gray-600 text-gray-400 hover:border-solid hover:border-green-500 hover:text-green-400"
              onClick={() => document.getElementById('signature-upload')?.click()}
              disabled={isUploadingSignature}
            >
              {isUploadingSignature ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Upload className="h-5 w-5 mr-2" />
              )}
              {isUploadingSignature ? 'Uploading...' : 'Upload Signature Image'}
            </Button>
          </div>
        )}
        <p className="text-xs text-gray-500 mt-1">💡 Tip: A handwritten signature adds a personal touch.</p>
      </div>

      <MediaLibraryModal
        open={showMediaLibrary}
        onOpenChange={setShowMediaLibrary}
        onSelect={handleMediaLibrarySelect}
        mode="single"
        allowedTypes={['image']}
        title="Select Signature Image"
      />
    </div>
  );
};

export default ArtistNoteEditor;
