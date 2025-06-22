"use client"

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Upload, User, Edit } from 'lucide-react';
import Image from 'next/image';

type VendorProfile = {
  id: string;
  name: string;
  bio: string;
  profile_image_url: string | null;
};

export function ProfileEdit() {
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchVendorProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: 'Authentication Error',
          description: 'Please log in to continue',
          variant: 'destructive'
        });
        return;
      }

      const { data, error } = await supabase
        .from('vendors')
        .select('id, name, bio, profile_image_url')
        .eq('id', user.id)
        .single();

      if (error) {
        toast({
          title: 'Error Fetching Profile',
          description: error.message,
          variant: 'destructive'
        });
        return;
      }

      setProfile(data);
      setBio(data.bio || '');
    };

    fetchVendorProfile();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    const supabase = createClient();
    let profileImageUrl = profile.profile_image_url;

    // Upload profile image if selected
    if (profileImage) {
      const fileExt = profileImage.name.split('.').pop();
      const fileName = `${profile.id}/profile_${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vendor-profiles')
        .upload(fileName, profileImage);

      if (uploadError) {
        toast({
          title: 'Image Upload Failed',
          description: uploadError.message,
          variant: 'destructive'
        });
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('vendor-profiles')
        .getPublicUrl(fileName);

      profileImageUrl = publicUrl;
    }

    // Validate bio
    if (bio.trim().length < 10) {
      toast({
        title: 'Bio Too Short',
        description: 'Please write a more detailed bio (at least 10 characters)',
        variant: 'destructive'
      });
      return;
    }

    // Update vendor profile
    const { error } = await supabase
      .from('vendors')
      .update({ 
        bio: bio.trim(),
        profile_image_url: profileImageUrl 
      })
      .eq('id', profile.id);

    if (error) {
      toast({
        title: 'Profile Update Failed',
        description: error.message,
        variant: 'destructive'
      });
      return;
    }

    // Update local state
    setProfile(prev => prev ? { 
      ...prev, 
      bio: bio.trim(), 
      profile_image_url: profileImageUrl 
    } : null);

    // Reset editing state
    setIsEditing(false);
    setProfileImage(null);

    toast({
      title: 'Profile Updated',
      description: 'Your profile has been successfully updated',
      variant: 'default'
    });
  };

  if (!profile) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="relative w-32 h-32 mx-auto">
        {/* Profile Image */}
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary">
          {(previewImage || profile.profile_image_url) ? (
            <Image 
              src={previewImage || profile.profile_image_url!} 
              alt="Profile" 
              width={128} 
              height={128} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <User className="w-16 h-16 text-gray-500" />
            </div>
          )}
        </div>

        {/* Image Upload Button */}
        {isEditing && (
          <div className="absolute bottom-0 right-0">
            <label 
              htmlFor="profile-image-upload" 
              className="cursor-pointer bg-primary text-white rounded-full p-2 hover:bg-primary-700"
            >
              <Upload className="w-5 h-5" />
              <input 
                type="file" 
                id="profile-image-upload"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
          </div>
        )}
      </div>

      {/* Name */}
      <h2 className="text-2xl font-bold text-center">{profile.name}</h2>

      {/* Bio Section */}
      {isEditing ? (
        <Textarea 
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell us about your artistic journey..."
          className="w-full min-h-[100px]"
        />
      ) : (
        <p className="text-center text-muted-foreground">
          {profile.bio || 'No bio available'}
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        {isEditing ? (
          <>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditing(false);
                setBio(profile.bio || '');
                setPreviewImage(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveProfile}>
              Save Profile
            </Button>
          </>
        ) : (
          <Button 
            variant="outline" 
            onClick={() => setIsEditing(true)}
          >
            <Edit className="mr-2 w-4 h-4" /> Edit Profile
          </Button>
        )}
      </div>
    </div>
  );
} 