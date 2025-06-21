import { createRouteHandler } from '@/lib/supabase/route-handler';
import { z } from 'zod';

export const GET = createRouteHandler(async (req, supabase) => {
  try {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userId = session.data.session.user.id;

    // Fetch products for the current vendor
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name')
      .eq('vendor_id', userId);

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify(products || []), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Products Fetch Error:', err);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch products',
      details: err instanceof Error ? err.message : 'Unknown error' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}); 