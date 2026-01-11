import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyCollectorSessionToken } from "@/lib/collector-session"
import type { CollectorEdition } from "@/types/collector"

export async function GET(request: NextRequest) {
  const supabase = createClient()

  const collectorSession = verifyCollectorSessionToken(request.cookies.get("collector_session")?.value)
  let customerId = collectorSession?.shopifyCustomerId || request.cookies.get("shopify_customer_id")?.value
  const searchParams = request.nextUrl.searchParams
  const emailParam = searchParams.get("email")

  if (!customerId && !emailParam) {
    return NextResponse.json(
      { success: false, message: "Missing customer session or email" },
      { status: 401 },
    )
  }

  try {
    let query = supabase
      .from("orders")
      .select(
        `
        id,
        processed_at,
        customer_email,
        order_line_items_v2 (
          id,
          line_item_id,
          product_id,
          name,
          img_url,
          vendor_name,
          edition_number,
          edition_total,
          price,
          certificate_url,
          created_at,
          status,
          nfc_claimed_at
        )
      `,
      )
      .order("processed_at", { ascending: false })

    if (customerId) {
      query = query.eq("customer_id", customerId)
    } else if (emailParam) {
      // If we only have an email, we should also try to find the Shopify Customer ID
      // to catch orders where the email might be missing but the ID is present.
      const { data: profile } = await supabase
        .from("collector_profile_comprehensive")
        .select("pii_sources")
        .eq("user_email", emailParam.toLowerCase().trim())
        .maybeSingle();

      const shopifyId = profile?.pii_sources?.shopify?.id;
      if (shopifyId) {
        query = query.or(`customer_email.eq.${emailParam.toLowerCase().trim()},customer_id.eq.${shopifyId}`);
      } else {
        query = query.eq("customer_email", emailParam.toLowerCase().trim());
      }
    }

    const { data: orders, error: ordersError } = await query

    if (ordersError) {
      console.error("collector editions error", ordersError)
      return NextResponse.json(
        { success: false, message: "Failed to load editions" },
        { status: 500 },
      )
    }

    // Deduplicate orders by numeric name prefix, prioritizing Shopify over Manual
    const orderMap = new Map();
    (orders || []).forEach(order => {
      const match = order.order_name?.replace('#', '').match(/^\d+/);
      const cleanName = match ? match[0] : (order.order_name?.toLowerCase() || order.id);
      
      const existing = orderMap.get(cleanName);
      const isManual = order.id.startsWith('WH-');
      const existingIsManual = existing?.id.startsWith('WH-');

      if (!existing || (existingIsManual && !isManual)) {
        orderMap.set(cleanName, order);
      }
    });

    const deduplicatedOrders = Array.from(orderMap.values());

    const allLineItems = deduplicatedOrders.flatMap((order) => 
      (order.order_line_items_v2 || []).map((li: any) => ({ 
        ...li, 
        order_processed_at: order.processed_at,
        order_fulfillment_status: order.fulfillment_status,
        order_financial_status: order.financial_status
      }))
    )

    // Get series information and fallback images for products
    const productIds = Array.from(new Set(allLineItems.map((li: any) => li.product_id).filter(Boolean) as string[]))
    const skus = Array.from(new Set(allLineItems.map((li: any) => li.sku).filter(Boolean) as string[]))
    const names = Array.from(new Set(allLineItems.map((li: any) => li.name).filter(Boolean) as string[]))

    let seriesMap = new Map<string, any>()
    let imageMap = new Map<string, string>()

    if (productIds.length > 0 || skus.length > 0 || names.length > 0) {
      // 1. Fetch series
      if (productIds.length > 0) {
        const { data: seriesMembers } = await supabase
          .from("artwork_series_members")
          .select(`
            shopify_product_id,
            series_id,
            artwork_series!inner (id, name, vendor_name)
          `)
          .in("shopify_product_id", productIds)

        seriesMembers?.forEach((member: any) => {
          if (member.shopify_product_id && member.artwork_series) {
            seriesMap.set(member.shopify_product_id, member.artwork_series)
          }
        })
      }

      // 2. Fetch fallback images
      const filters = [];
      if (productIds.length > 0) filters.push(`product_id.in.(${productIds.join(',')})`);
      if (skus.length > 0) filters.push(`sku.in.(${skus.map(s => `"${s}"`).join(',')})`);
      if (names.length > 0) filters.push(`name.in.(${names.map(n => `"${n}"`).join(',')})`);

      const { data: products } = await supabase
        .from('products')
        .select('product_id, sku, name, img_url, image_url')
        .or(filters.join(','));

      products?.forEach(p => {
        const img = p.img_url || p.image_url;
        if (p.product_id) imageMap.set(`id_${p.product_id}`, img);
        if (p.sku) imageMap.set(`sku_${p.sku.toLowerCase().trim()}`, img);
        if (p.name) imageMap.set(`name_${p.name.toLowerCase().trim()}`, img);
      });
    }

    // Filter for active items that have an assigned edition number.
    // Explicitly exclude restocked and cancelled items.
    const editions: CollectorEdition[] = allLineItems
      .filter((li: any) => {
        const isValidOrder = !['restocked', 'canceled'].includes(li.order_fulfillment_status) && 
                           !['refunded', 'voided'].includes(li.order_financial_status);
        return li.status === 'active' && li.edition_number !== null && isValidOrder;
      })
      .map((li: any) => {
        const series = li.product_id
          ? seriesMap.get(li.product_id)
          : null

        // Apply fallback image
        let imgUrl = li.img_url;
        if (!imgUrl || imgUrl.includes('placehold')) {
          imgUrl = 
            (li.product_id && imageMap.get(`id_${li.product_id}`)) ||
            (li.sku && imageMap.get(`sku_${li.sku.toLowerCase().trim()}`)) ||
            (li.name && imageMap.get(`name_${li.name.toLowerCase().trim()}`)) ||
            imgUrl;
        }

        // Determine edition type
        let editionType: "limited" | "open" | "accessory" | null = null
        if (li.edition_total && li.edition_total > 0) {
          editionType = "limited"
        } else if (li.edition_number !== null) {
          editionType = "open"
        } else if (li.vendor_name === 'Street Collector' || !li.vendor_name) {
          editionType = "accessory"
        }

        // Determine verification source
        let verificationSource: CollectorEdition["verificationSource"] = null
        if (li.nfc_claimed_at) {
          verificationSource = "supabase"
        }

        return {
          id: li.id,
          lineItemId: li.line_item_id,
          productId: li.product_id,
          name: li.name,
          editionNumber: li.edition_number,
          editionTotal: li.edition_total,
          editionType,
          verificationSource,
          imgUrl: imgUrl,
          vendorName: li.vendor_name || 'Street Collector',
          series: series
            ? {
                id: series.id,
                name: series.name,
                vendorName: series.vendor_name,
              }
            : null,
          purchaseDate: li.created_at || li.order_processed_at || new Date().toISOString(),
          price: li.price,
          certificateUrl: li.certificate_url,
        }
      })

    return NextResponse.json({
      success: true,
      editions,
    })
  } catch (error: any) {
    console.error("collector editions unexpected error", error)
    return NextResponse.json(
      { success: false, message: "Unexpected server error" },
      { status: 500 },
    )
  }
}


