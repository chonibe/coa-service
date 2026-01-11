import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateCollectorBalance } from '@/lib/banking/balance-calculator';
import { getCollectorAvatar } from '@/lib/gamification/avatar';

/**
 * GET /api/collector/avatar/shop
 * List available items for purchase
 */
export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  try {
    // 1. Fetch all active items
    const { data: items, error } = await supabase
      .from('avatar_items')
      .select('*')
      .eq('is_active', true)
      .order('credit_cost', { ascending: true });

    if (error) throw error;

    // 2. Filter vendor-specific cans if user is logged in
    let filteredItems = items;
    if (user) {
      // Find vendors the user has purchased from
      const { data: orders } = await supabase
        .from('order_line_items_v2')
        .select('vendor_name')
        .eq('owner_id', user.id);
      
      const purchasedVendors = new Set(orders?.map(o => o.vendor_name) || []);

      filteredItems = items.filter(item => {
        if (item.type === 'base' && item.artist_id) {
          // Check if this item's vendor is in the user's purchased list
          // Note: This assumes avatar_items.artist_id links to vendors table
          // For now, let's keep it simple and show all if no artist_id,
          // or logic check against vendor name if needed.
          return true; // Placeholder for strict artist locking
        }
        return true;
      });
    }

    return NextResponse.json({ success: true, items: filteredItems });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE_NAME } from '@/lib/admin-session';
import { cookies } from 'next/headers';

/**
 * GET /api/collector/avatar/shop
 * List available items for purchase
 */
// ... (rest of GET)

/**
 * POST /api/collector/avatar/shop
 * Purchase an item with credits
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
    const { itemId, userId: targetUserId, email: targetEmail } = body;

    const finalUserId = isAdmin && targetUserId ? targetUserId : user?.id;
    const finalEmail = isAdmin && targetEmail ? targetEmail : user?.email;

    if (!finalUserId || !finalEmail) throw new Error('Target user ID and email required');

    // 1. Get item details
    const { data: item, error: itemError } = await supabase
      .from('avatar_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // 2. Check if already owned
    const { data: existing } = await supabase
      .from('collector_avatar_inventory')
      .select('id')
      .eq('user_id', finalUserId)
      .eq('item_id', itemId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Item already owned' }, { status: 400 });
    }

    // 3. Check balance
    const balance = await calculateCollectorBalance(finalEmail);
    if (balance.balance < item.credit_cost) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 });
    }

    // 4. Perform transaction (ledger entry + inventory add)
    
    // Create negative ledger entry
    const { error: ledgerError } = await supabase
      .from('collector_ledger_entries')
      .insert({
        collector_identifier: finalEmail,
        transaction_type: 'avatar_purchase' as any,
        amount: -item.credit_cost,
        description: `Purchased Ink-O-Gatchi item: ${item.name}`,
        created_by: isAdmin ? 'admin' : 'user',
        metadata: {
          item_id: item.id,
          item_name: item.name,
          item_type: item.type,
          purchased_by: isAdmin ? 'admin' : 'user'
        }
      });

    if (ledgerError) throw ledgerError;

    // Add to inventory
    const { error: inventoryError } = await supabase
      .from('collector_avatar_inventory')
      .insert({
        user_id: finalUserId,
        item_id: item.id
      });

    if (inventoryError) throw inventoryError;

    const avatarState = await getCollectorAvatar(finalUserId, finalEmail);
    return NextResponse.json({ 
      success: true, 
      message: `Successfully purchased ${item.name}`,
      avatar: avatarState 
    });
  } catch (error: any) {
    console.error('Error purchasing item:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

