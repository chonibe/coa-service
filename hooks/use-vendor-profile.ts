'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export type VendorProfile = {
  id: string;
  bio: string | null;
  bio_status: 'incomplete' | 'completed';
  products: Array<{
    id: string;
    name: string;
    artwork_story: string | null;
    artwork_story_status: 'incomplete' | 'completed';
  }>;
  profile_completed: boolean;
};

export function useVendorProfile() {
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVendorProfile = async () => {
      try {
        setIsLoading(true);
        const supabase = createClient();

        // Fetch vendor details
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select(`
            id, 
            bio, 
            bio_status,
            profile_completed,
            products:products(
              id, 
              name, 
              order_line_items_v2(artwork_story, artwork_story_status)
            )
          `)
          .single();

        if (vendorError) throw vendorError;

        // Transform products data
        const transformedProducts = vendorData.products.map(product => ({
          id: product.id,
          name: product.name,
          artwork_story: product.order_line_items_v2[0]?.artwork_story || null,
          artwork_story_status: product.order_line_items_v2[0]?.artwork_story_status || 'incomplete'
        }));

        const profileData: VendorProfile = {
          id: vendorData.id,
          bio: vendorData.bio,
          bio_status: vendorData.bio_status,
          products: transformedProducts,
          profile_completed: vendorData.profile_completed
        };

        setProfile(profileData);
      } catch (err) {
        console.error('Vendor Profile Fetch Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendorProfile();
  }, []);

  const updateBio = async (bio: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('vendors')
        .update({ bio, bio_status: 'completed' })
        .eq('id', profile?.id);

      if (error) throw error;

      // Optimistically update local state
      setProfile(prev => prev ? { 
        ...prev, 
        bio, 
        bio_status: 'completed' 
      } : null);
    } catch (err) {
      console.error('Bio Update Error:', err);
      throw err;
    }
  };

  const updateArtworkStory = async (productId: string, story: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('order_line_items_v2')
        .update({ 
          artwork_story: story, 
          artwork_story_status: 'completed' 
        })
        .eq('product_id', productId);

      if (error) throw error;

      // Optimistically update local state
      setProfile(prev => {
        if (!prev) return null;
        
        const updatedProducts = prev.products.map(product => 
          product.id === productId 
            ? { ...product, artwork_story: story, artwork_story_status: 'completed' }
            : product
        );

        return { 
          ...prev, 
          products: updatedProducts 
        };
      });
    } catch (err) {
      console.error('Artwork Story Update Error:', err);
      throw err;
    }
  };

  return {
    profile,
    isLoading,
    error,
    updateBio,
    updateArtworkStory
  };
} 