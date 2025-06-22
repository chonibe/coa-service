'use client';

import React, { useState, KeyboardEvent } from 'react';
import { Input } from './input';
import { Badge } from './badge';
import { X } from 'lucide-react';

type HashtagInputProps = {
  onHashtagsChange: (hashtags: string[]) => void;
  placeholder?: string;
};

export const HashtagInput: React.FC<HashtagInputProps> = ({ 
  onHashtagsChange, 
  placeholder = "Add hashtags" 
}) => {
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');

  const addHashtag = (tag: string) => {
    const cleanTag = tag.trim().replace(/^#/, '');
    if (cleanTag && !hashtags.includes(cleanTag)) {
      const newHashtags = [...hashtags, cleanTag];
      setHashtags(newHashtags);
      onHashtagsChange(newHashtags);
      setInputValue('');
    }
  };

  const removeHashtag = (tagToRemove: string) => {
    const newHashtags = hashtags.filter(tag => tag !== tagToRemove);
    setHashtags(newHashtags);
    onHashtagsChange(newHashtags);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      addHashtag(inputValue);
    }
  };

  return (
    <div className="space-y-2">
      <Input 
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full"
      />
      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {hashtags.map(tag => (
            <Badge 
              key={tag} 
              variant="secondary" 
              className="flex items-center"
            >
              #{tag}
              <X 
                className="ml-2 h-4 w-4 cursor-pointer" 
                onClick={() => removeHashtag(tag)} 
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

type LocationInputProps = {
  onLocationChange: (location: string) => void;
  placeholder?: string;
};

export const LocationInput: React.FC<LocationInputProps> = ({ 
  onLocationChange, 
  placeholder = "Add location" 
}) => {
  const [location, setLocation] = useState('');

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLocation = e.target.value;
    setLocation(newLocation);
    onLocationChange(newLocation);
  };

  return (
    <Input 
      value={location}
      onChange={handleLocationChange}
      placeholder={placeholder}
      className="w-full"
    />
  );
};

type MentionInputProps = {
  onMentionsChange: (mentions: string[]) => void;
  placeholder?: string;
};

export const MentionInput: React.FC<MentionInputProps> = ({ 
  onMentionsChange, 
  placeholder = "Mention artists" 
}) => {
  const [mentions, setMentions] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');

  const addMention = (mention: string) => {
    const cleanMention = mention.trim().replace(/^@/, '');
    if (cleanMention && !mentions.includes(cleanMention)) {
      const newMentions = [...mentions, cleanMention];
      setMentions(newMentions);
      onMentionsChange(newMentions);
      setInputValue('');
    }
  };

  const removeMention = (mentionToRemove: string) => {
    const newMentions = mentions.filter(mention => mention !== mentionToRemove);
    setMentions(newMentions);
    onMentionsChange(newMentions);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      addMention(inputValue);
    }
  };

  return (
    <div className="space-y-2">
      <Input 
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full"
      />
      {mentions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {mentions.map(mention => (
            <Badge 
              key={mention} 
              variant="secondary" 
              className="flex items-center"
            >
              @{mention}
              <X 
                className="ml-2 h-4 w-4 cursor-pointer" 
                onClick={() => removeMention(mention)} 
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}; 