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
      `);

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

    // 3. Deduplicate orders by name in memory
    // Priority: Shopify (no WH- prefix and no #9/9 prefix) > Manual (WH- prefix or #9/9 prefix)
    // Use numeric prefix for deduplication to catch cases like #1188 and 1188A
    const orderMap = new Map();
    const allProductIds = new Set();
    const allSkus = new Set();
    const allNames = new Set();

    (orders || []).forEach(order => {
      const match = order.order_name?.replace('#', '').match(/^\d+/);
      const cleanName = match ? match[0] : (order.order_name?.toLowerCase() || order.id);
      
      const existing = orderMap.get(cleanName);
      
      const orderName = order.order_name || '';
      const isManual = order.id.startsWith('WH-') || orderName.startsWith('#9') || orderName.startsWith('9');
      const existingIsManual = existing?.id.startsWith('WH-') || (existing?.order_name || '').startsWith('#9') || (existing?.order_name || '').startsWith('9');

      if (!existing || (existingIsManual && !isManual)) {
        orderMap.set(cleanName, order);
        
        // Collect identifying info for fallback image matching
        order.order_line_items_v2?.forEach((li: any) => {
          if (li.product_id) allProductIds.add(li.product_id.toString());
          if (li.sku) allSkus.add(li.sku.toLowerCase().trim());
          if (li.name) allNames.add(li.name.toLowerCase().trim());
        });
      }
    });

    // 4. Fetch missing product images for fallback
    const productMap = new Map();
    if (allProductIds.size > 0 || allSkus.size > 0 || allNames.size > 0) {
      const filters = [];
      if (allProductIds.size > 0) filters.push(`product_id.in.(${Array.from(allProductIds).join(',')})`);
      if (allSkus.size > 0) filters.push(`sku.in.(${Array.from(allSkus).map(s => `"${s}"`).join(',')})`);
      if (allNames.size > 0) filters.push(`name.in.(${Array.from(allNames).map(n => `"${n}"`).join(',')})`);

      const { data: products } = await supabase
        .from('products')
        .select('product_id, sku, name, img_url, image_url')
        .or(filters.join(','));

      products?.forEach(p => {
        const img = p.img_url || p.image_url;
        if (p.product_id) productMap.set(`id_${p.product_id}`, img);
        if (p.sku) productMap.set(`sku_${p.sku.toLowerCase().trim()}`, img);
        if (p.name) productMap.set(`name_${p.name.toLowerCase().trim()}`, img);
      });
    }

    const deduplicatedOrders = Array.from(orderMap.values()).map(order => {
      // Apply fallback images to line items
      const items = order.order_line_items_v2?.map((li: any) => {
        if (li.img_url && !li.img_url.includes('placehold')) return li;
        
        const fallback = 
          (li.product_id && productMap.get(`id_${li.product_id}`)) ||
          (li.sku && productMap.get(`sku_${li.sku.toLowerCase().trim()}`)) ||
          (li.name && productMap.get(`name_${li.name.toLowerCase().trim()}`));
          
        return { ...li, img_url: fallback || li.img_url };
      });
      return { ...order, order_line_items_v2: items };
    }).sort((a, b) => 
      new Date(b.processed_at).getTime() - new Date(a.processed_at).getTime()
    );
    
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

