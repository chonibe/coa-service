import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session";
import { getCollectorProfile } from "@/lib/collectors";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const adminSession = verifyAdminSessionToken(token);
  
  if (!adminSession?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient();
  const collectorId = params.id;

  try {
    // 1. Get the profile using the unified helper (handles Email, Shopify ID, or User ID)
    const profile = await getCollectorProfile(collectorId);

    if (!profile) {
      return NextResponse.json({ error: "Collector not found" }, { status: 404 });
    }

    const shopifyCustomerId = profile.shopify_customer_id;
    const email = profile.user_email;
    const associatedOrderNames = profile.associated_order_names || [];

    // 2. Fetch orders and line items from v2 tables with deduplication
    // CRITICAL: Filter out canceled/voided orders
    let query = supabase
      .from("orders")
      .select(`
        id,
        order_number,
        order_name,
        processed_at,
        financial_status,
        fulfillment_status,
        total_price,
        currency_code,
        customer_email,
        customer_id,
        order_line_items_v2 (
          id,
          line_item_id,
          product_id,
          name,
          description,
          price,
          quantity,
          vendor_name,
          img_url,
          edition_number,
          edition_total,
          status,
          nfc_claimed_at,
          certificate_url
        )
      `)
      .not("fulfillment_status", "in", "(canceled,restocked)")
      .not("financial_status", "in", "(voided,refunded)");

    const filters = [];
    if (shopifyCustomerId) filters.push(`customer_id.eq.${shopifyCustomerId}`);
    if (email) filters.push(`customer_email.ilike.${email}`);
    
    // Add specific order name matches for robust linkage
    if (associatedOrderNames.length > 0) {
      const namesList = associatedOrderNames.map((n: string) => `"${n}"`).join(',');
      filters.push(`order_name.in.(${namesList})`);
    }

    if (filters.length > 0) {
      query = query.or(filters.join(','));
    } else {
      // Last resort fallback
      if (collectorId.match(/^[0-9]+$/)) {
        query = query.eq("customer_id", collectorId);
      } else {
        return NextResponse.json({ orders: [], profile });
      }
    }

    const { data: orders, error: ordersError } = await query.order("processed_at", { ascending: false });

    if (ordersError) {
      console.error("[Collector Activity API] Error fetching orders:", ordersError);
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    // 2.5 Fetch missing images from products table
    // Filter line items by active status
    const allLineItems = (orders || []).flatMap(o => 
      (o.order_line_items_v2 || []).filter((li: any) => 
        li.status === 'active' && 
        li.restocked !== true
      )
    );
    const itemsMissingImages = allLineItems.filter(li => !li.img_url && li.product_id);
    
    if (itemsMissingImages.length > 0) {
      const missingProductIds = Array.from(new Set(itemsMissingImages.map(li => li.product_id)));
      const { data: products } = await supabase
        .from('products')
        .select('product_id, image_url, img_url')
        .in('product_id', missingProductIds);
      
      if (products && products.length > 0) {
        const productImgMap = new Map(products.map(p => [p.product_id?.toString(), p.image_url || p.img_url]));
        allLineItems.forEach(li => {
          if (!li.img_url && li.product_id) {
            li.img_url = productImgMap.get(li.product_id.toString()) || null;
          }
        });
      }
    }

    // 3. Deduplicate orders by name in memory
    // Priority: Shopify (no WH- prefix and no #9/9 prefix) > Manual (WH- prefix or #9/9 prefix)
    // Use numeric prefix for deduplication to catch cases like #1188 and 1188A
    const orderMap = new Map();
    (orders || []).forEach(order => {
      const match = order.order_name?.replace('#', '').match(/^\d+/);
      const cleanName = match ? match[0] : (order.order_name?.toLowerCase() || order.id);
      
      const existing = orderMap.get(cleanName);
      
      const orderName = order.order_name || '';
      const isManual = order.id.startsWith('WH-') || orderName.startsWith('#9') || orderName.startsWith('9');
      const existingIsManual = existing?.id.startsWith('WH-') || (existing?.order_name || '').startsWith('#9') || (existing?.order_name || '').startsWith('9');

      if (!existing || (existingIsManual && !isManual)) {
        orderMap.set(cleanName, order);
      }
    });

    const deduplicatedOrders = Array.from(orderMap.values()).sort((a, b) => 
      new Date(b.processed_at).getTime() - new Date(a.processed_at).getTime()
    );
    
    console.log(`📊 [Activity API] Stats for ${email || shopifyCustomerId}:`)
    console.log(`   - Orders fetched: ${orders?.length || 0}`)
    console.log(`   - Orders after deduplication: ${deduplicatedOrders.length}`)
    console.log(`   - Active line items: ${deduplicatedOrders.flatMap(o => (o.order_line_items_v2 || []).filter((li: any) => li.status === 'active')).length}`)
    console.log(`   - Unique products: ${new Set(deduplicatedOrders.flatMap(o => (o.order_line_items_v2 || []).filter((li: any) => li.status === 'active').map((li: any) => li.product_id))).size}`)
    
    return NextResponse.json({
      orders: deduplicatedOrders,
      profile: {
        id: profile.user_id,
        email: profile.user_email,
        display_name: profile.display_name
      }
    });

  } catch (err: any) {
    console.error("[Collector Activity API] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
