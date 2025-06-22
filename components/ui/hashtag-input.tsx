'use client';

import React, { useState, KeyboardEvent } from 'react';
import { Input } from './input';
import { X } from 'lucide-react';
import { toast } from './use-toast';

type HashtagInputProps = {
  onHashtagsChange: (hashtags: string[]) => void;
  maxHashtags?: number;
};

export const HashtagInput: React.FC<HashtagInputProps> = ({
  onHashtagsChange,
  maxHashtags = 10
}) => {
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [currentHashtag, setCurrentHashtag] = useState('');

  const addHashtag = () => {
    const cleanedHashtag = currentHashtag.trim().replace(/^#/, '').toLowerCase();
    
    if (!cleanedHashtag) return;
    
    if (hashtags.includes(cleanedHashtag)) {
      toast({
        title: 'Duplicate Hashtag',
        description: 'This hashtag is already added.',
        variant: 'destructive'
      });
      return;
    }

    if (hashtags.length >= maxHashtags) {
      toast({
        title: 'Hashtag Limit Reached',
        description: `You can only add up to ${maxHashtags} hashtags.`,
        variant: 'destructive'
      });
      return;
    }

    const newHashtags = [...hashtags, cleanedHashtag];
    setHashtags(newHashtags);
    onHashtagsChange(newHashtags);
    setCurrentHashtag('');
  };

  const removeHashtag = (tagToRemove: string) => {
    const newHashtags = hashtags.filter(tag => tag !== tagToRemove);
    setHashtags(newHashtags);
    onHashtagsChange(newHashtags);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      addHashtag();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {hashtags.map(tag => (
          <span 
            key={tag} 
            className="flex items-center bg-blue-50 text-blue-600 px-2 py-1 rounded-full text-sm"
          >
            #{tag}
            <button 
              onClick={() => removeHashtag(tag)}
              className="ml-1 text-blue-400 hover:text-blue-600"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      
      <Input 
        value={currentHashtag}
        onChange={(e) => setCurrentHashtag(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={`Add hashtags (${hashtags.length}/${maxHashtags})`}
      />
    </div>
  );
}; 