import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';

type RouteHandler = (
  req: NextRequest, 
  supabase: SupabaseClient
) => Promise<Response>;

export function createRouteHandler(handler: RouteHandler) {
  return async (req: NextRequest) => {
    const supabase = createClient();
    
    try {
      return await handler(req, supabase);
    } catch (error) {
      console.error('Route Handler Error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };
} 