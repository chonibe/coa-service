import { createRouteHandler } from '@/lib/supabase/route-handler';
import { z } from 'zod';

// Validation schema for bio
const BioUpdateSchema = z.object({
  bio: z.string().max(500, "Bio must be 500 characters or less")
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
    const validatedData = BioUpdateSchema.parse(rawData);

    const { error } = await supabase
      .from('vendors')
      .update({ bio: validatedData.bio })
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ 
      message: 'Bio updated successfully',
      bio: validatedData.bio 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Bio Update Error:', err);
    
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
      error: 'Failed to update bio',
      details: err instanceof Error ? err.message : 'Unknown error' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
