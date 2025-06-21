import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Validation Schema
const StorySubmissionSchema = z.object({
  productId: z.string().uuid(),
  story: z.object({
    text: z.string().min(10).max(1000),
    tags: z.array(z.string()).optional(),
    location: z.string().optional(),
    collaborators: z.array(z.string()).optional(),
    images: z.array(z.string()).optional() // Base64 or URLs
  })
});

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  try {
    // Get authenticated user
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = StorySubmissionSchema.parse(body);

    // Check vendor ownership of product
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('vendor_id')
      .eq('id', validatedData.productId)
      .single();

    if (productError || !productData) {
      return NextResponse.json({ 
        error: 'Product not found' 
      }, { status: 404 });
    }

    // Verify current user is the vendor
    if (productData.vendor_id !== session.user.id) {
      return NextResponse.json({ 
        error: 'Unauthorized to modify this product' 
      }, { status: 403 });
    }

    // Upload images if present
    let imageUrls: string[] = [];
    if (validatedData.story.images && validatedData.story.images.length > 0) {
      const uploadPromises = validatedData.story.images.map(async (base64Image, index) => {
        const buffer = Buffer.from(base64Image.split(',')[1], 'base64');
        const filename = `product-story-${validatedData.productId}-${index}.jpg`;
        
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('product-stories')
          .upload(filename, buffer, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (uploadError) {
          console.error('Image upload error:', uploadError);
          return null;
        }

        const { data: { publicUrl } } = supabase
          .storage
          .from('product-stories')
          .getPublicUrl(filename);

        return publicUrl;
      });

      imageUrls = (await Promise.all(uploadPromises)).filter(url => url !== null);
    }

    // Store story in database
    const { data: storyData, error: storyError } = await supabase
      .from('product_stories')
      .upsert({
        product_id: validatedData.productId,
        story_text: validatedData.story.text,
        tags: validatedData.story.tags,
        location: validatedData.story.location,
        collaborators: validatedData.story.collaborators,
        image_urls: imageUrls,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    if (storyError) {
      console.error('Story submission error:', storyError);
      return NextResponse.json({ 
        error: 'Failed to submit story' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Story submitted successfully',
      story: storyData[0]
    }, { status: 200 });

  } catch (error) {
    console.error('Submission error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed',
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 