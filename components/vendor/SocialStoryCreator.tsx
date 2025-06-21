import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Image, Tag, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface SocialStoryProps {
  productId: string;
  onSubmit: (story: {
    text: string;
    tags: string[];
    location?: string;
    collaborators?: string[];
  }) => void;
}

export function SocialStoryCreator({ productId, onSubmit }: SocialStoryProps) {
  const [images, setImages] = useState<File[]>([]);
  const [story, setStory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [collaborators, setCollaborators] = useState<string[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleSubmit = () => {
    onSubmit({
      text: story,
      tags,
      location,
      collaborators
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto bg-white shadow-lg rounded-xl p-6 space-y-4"
    >
      {/* Image Upload */}
      <div className="image-upload-container">
        <label className="flex items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            className="hidden" 
            onChange={handleImageUpload}
          />
          {images.length === 0 ? (
            <div className="flex flex-col items-center">
              <Upload className="w-12 h-12 text-gray-400" />
              <span className="mt-2 text-sm text-gray-500">Upload Product Images</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {images.map((image, index) => (
                <img 
                  key={index} 
                  src={URL.createObjectURL(image)} 
                  alt={`Uploaded ${index}`} 
                  className="w-full h-24 object-cover rounded"
                />
              ))}
            </div>
          )}
        </label>
      </div>

      {/* Story Input */}
      <Textarea 
        placeholder="Tell the story behind your artwork..." 
        value={story}
        onChange={(e) => setStory(e.target.value)}
        className="w-full min-h-[120px]"
      />

      {/* Additional Context */}
      <div className="flex space-x-2">
        {/* Tags */}
        <div className="flex-1">
          <Input 
            placeholder="Add tags" 
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value) {
                setTags([...tags, e.currentTarget.value]);
                e.currentTarget.value = '';
              }
            }}
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag, index) => (
              <span 
                key={index} 
                className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center"
              >
                <Tag className="w-3 h-3 mr-1" /> {tag}
                <button 
                  onClick={() => setTags(tags.filter((_, i) => i !== index))}
                  className="ml-1 text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Location and Collaborators */}
      <div className="flex space-x-2">
        <Input 
          placeholder="Location" 
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          prefix={<MapPin className="w-4 h-4" />}
        />
        <Input 
          placeholder="Collaborators" 
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.currentTarget.value) {
              setCollaborators([...collaborators, e.currentTarget.value]);
              e.currentTarget.value = '';
            }
          }}
          prefix={<Users className="w-4 h-4" />}
        />
      </div>

      {/* Submit Button */}
      <Button 
        onClick={handleSubmit} 
        className="w-full"
        disabled={!story}
      >
        Share Your Artwork Story
      </Button>
    </motion.div>
  );
} 