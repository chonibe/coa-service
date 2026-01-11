import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCollectorAvatar } from '@/lib/gamification/avatar';
import { cookies } from 'next/headers';
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE_NAME } from '@/lib/admin-session';

/**
 * GET /api/collector/avatar
 * Fetch the collector's avatar state
 */
export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get('userId');
  const targetEmail = searchParams.get('email');

  // Check if requester is admin
  const cookieStore = cookies();
  const adminToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const isAdmin = !!verifyAdminSessionToken(adminToken);

  // If no target provided, use current session user
  if (!targetUserId && !targetEmail) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
      const avatarState = await getCollectorAvatar(user.id, user.email!);
      return NextResponse.json({ success: true, avatar: avatarState });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Public fetch (for guests or viewing others)
  try {
    // If we only have email, we need to find the user_id first
    let userId = targetUserId;
    let email = targetEmail;

    if (!userId && email) {
      const { data: profile } = await supabase
        .from('collector_profiles')
        .select('user_id')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();
      
      if (profile?.user_id) {
        userId = profile.user_id;
      }
    }

    if (!userId || !email) {
      // If we still don't have both, we can't fetch fully
      // but let's try to get just the level from email if possible
      if (email) {
        const { getCollectorLevel } = await import('@/lib/gamification/level-logic');
        const xpInfo = await getCollectorLevel(email);
        return NextResponse.json({ 
          success: true, 
          avatar: { 
            level: xpInfo.level, 
            evolutionStage: xpInfo.evolutionStage,
            xpInfo,
            equippedItems: {},
            inventory: []
          } 
        });
      }
      return NextResponse.json({ error: 'Missing identifier' }, { status: 400 });
    }

    const avatarState = await getCollectorAvatar(userId, email);
    return NextResponse.json({ success: true, avatar: avatarState });
  } catch (error: any) {
    console.error('Error fetching public avatar:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/collector/avatar
 * Equip or unequip items
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check if requester is admin
  const cookieStore = cookies();
  const adminToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const isAdmin = !!verifyAdminSessionToken(adminToken);

  if (!user && !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { equippedItems, userId: targetUserId, email: targetEmail } = body; // Map of { slot: itemId | null }

    const finalUserId = isAdmin && targetUserId ? targetUserId : user?.id;
    const finalEmail = isAdmin && targetEmail ? targetEmail : user?.email;

    if (!finalUserId) throw new Error('Target user ID required');

    const { error } = await supabase
      .from('collector_avatars')
      .update({
        equipped_items: equippedItems,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', finalUserId);

    if (error) throw error;

    const avatarState = await getCollectorAvatar(finalUserId, finalEmail || '');
    return NextResponse.json({ success: true, avatar: avatarState });
  } catch (error: any) {
    console.error('Error updating avatar:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

