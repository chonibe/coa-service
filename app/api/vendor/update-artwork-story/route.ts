import { createRouteHandler } from '@/lib/supabase/route-handler';
import { z } from 'zod';

// Validation schema for artwork story
const ArtworkStoryUpdateSchema = z.object({
  product_id: z.string().uuid(),
  artwork_story: z.string().max(1000, "Artwork story must be 1000 characters or less")
});

export const POST = createRouteHandler(async (req, supabase) => {
  try {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userId = session.data.session.user.id;
    const rawData = await req.json();
    
    // Validate input
    const validatedData = ArtworkStoryUpdateSchema.parse(rawData);

    // First, verify the product belongs to the vendor
    const { data: productCheck, error: productCheckError } = await supabase
      .from('products')
      .select('vendor_id')
      .eq('id', validatedData.product_id)
      .eq('vendor_id', userId)
      .single();

    if (productCheckError || !productCheck) {
      return new Response(JSON.stringify({ 
        error: 'Product not found or unauthorized' 
      }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { error } = await supabase
      .from('order_line_items')
      .update({ 
        artwork_story: validatedData.artwork_story,
        artwork_story_status: 'completed'
      })
      .eq('product_id', validatedData.product_id);

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ 
      message: 'Artwork story updated successfully',
      artwork_story: validatedData.artwork_story 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Artwork Story Update Error:', err);
    
    if (err instanceof z.ZodError) {
      return new Response(JSON.stringify({ 
        error: 'Validation failed',
        details: err.errors 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      error: 'Failed to update artwork story',
      details: err instanceof Error ? err.message : 'Unknown error' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
