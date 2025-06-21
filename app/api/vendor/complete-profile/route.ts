import { createRouteHandler } from '@/lib/supabase/route-handler';

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

    // Update vendor profile completion status
    const { error } = await supabase
      .from('vendors')
      .update({ 
        profile_completed: true,
        profile_completion_date: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ 
      message: 'Profile completed successfully',
      status: 'complete'
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Profile Completion Error:', err);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to complete profile',
      details: err instanceof Error ? err.message : 'Unknown error' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}); 