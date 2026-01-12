import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyCollectorSessionToken } from "@/lib/collector-session"
import type { CollectorEdition } from "@/types/collector"
import { getCollectorProfile } from "@/lib/collectors"

export async function GET(request: NextRequest) {
  const supabase = createClient()

  const searchParams = request.nextUrl.searchParams
  const emailParam = searchParams.get("email")
  const idParam = searchParams.get("id")

  // Check for admin session cookie to allow overriding customer session
  const isAdmin = request.cookies.get('admin_session')?.value !== undefined;

  const collectorSession = verifyCollectorSessionToken(request.cookies.get("collector_session")?.value)
  let customerId = collectorSession?.shopifyCustomerId || request.cookies.get("shopify_customer_id")?.value

  // Priority: URL params (especially for Admin) > Session
  let shopifyCustomerId = idParam || customerId;
  let email = emailParam;

  if (!shopifyCustomerId && !email) {
    return NextResponse.json(
      { success: false, message: "Missing identifier" },
      { status: 401 },
    )
  }

  try {
    // 1. Get identifiers for robust linkage
    let associatedOrderNames: string[] = [];

    const lookupId = idParam || emailParam || customerId;
    if (lookupId) {
      const profile = await getCollectorProfile(lookupId);
      if (profile) {
        shopifyCustomerId = profile.shopify_customer_id || shopifyCustomerId;
        email = profile.user_email || email;
        associatedOrderNames = profile.associated_order_names || [];
      }
    }

    // 2. Fetch orders and line items
    let query = supabase
      .from("orders")
      .select(
        `
        id,
        processed_at,
        customer_email,
        customer_id,
        order_name,
        order_number,
        fulfillment_status,
        financial_status,
        order_line_items_v2 (
          *
        )
      `,
      );

    const filters = [];
    if (shopifyCustomerId) filters.push(`customer_id.eq.${shopifyCustomerId}`);
    if (email) filters.push(`customer_email.ilike.${email}`);
    if (associatedOrderNames && associatedOrderNames.length > 0) {
      const namesList = associatedOrderNames.map((n: string) => `"${n}"`).join(',');
      filters.push(`order_name.in.(${namesList})`);
    }

    if (filters.length > 0) {
      query = query.or(filters.join(','));
    } else {
      return NextResponse.json({ success: true, editions: [] });
    }

    const { data: orders, error: ordersError } = await query.order("processed_at", { ascending: false });

    if (ordersError) {
      console.error("collector editions error", ordersError)
      return NextResponse.json(
        { success: false, message: "Failed to load editions" },
        { status: 500 },
      )
    }

    // 3. Deduplicate orders
    const orderMap = new Map();
    (orders || []).forEach(order => {
      const match = order.order_name?.replace('#', '').match(/^\d+/);
      const cleanName = match ? match[0] : (order.order_name?.toLowerCase() || order.id);
      
      const existing = orderMap.get(cleanName);
      const isManual = order.id.startsWith('WH-');
      
      // NEW: Prioritize orders that are NOT canceled/voided
      const isCanceled = ['restocked', 'canceled'].includes(order.fulfillment_status) || 
                         ['refunded', 'voided'].includes(order.financial_status);
      const existingIsCanceled = existing ? 
                         (['restocked', 'canceled'].includes(existing.fulfillment_status) || 
                          ['refunded', 'voided'].includes(existing.financial_status)) : true;

      // Decision logic:
      // 1. If no existing order, take this one
      // 2. If this one is NOT canceled but the existing one IS, replace it
      // 3. If both have same cancellation status, prefer Shopify over Manual
      if (!existing) {
        orderMap.set(cleanName, order);
      } else if (!isCanceled && existingIsCanceled) {
        orderMap.set(cleanName, order);
      } else if (isCanceled === existingIsCanceled) {
        const existingIsManual = existing.id.startsWith('WH-');
        if (existingIsManual && !isManual) {
          orderMap.set(cleanName, order);
        }
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
    );

    // 4. Batch fetch missing images
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

    // 5. Get series and product edition info
    const productIds = Array.from(
      new Set(
        allLineItems
          .map((li: any) => li.product_id)
          .filter(Boolean) as string[],
      ),
    )

    let seriesMap = new Map<string, any>()
    let productTotalMap = new Map<string, number>()

    if (productIds.length > 0) {
      const { data: seriesMembers } = await supabase
        .from("artwork_series_members")
        .select(
          `
          shopify_product_id,
          series_id,
          artwork_series!inner (
            id,
            name,
            vendor_name
          )
        `,
        )
        .in("shopify_product_id", productIds)

      seriesMembers?.forEach((member: any) => {
        if (member.shopify_product_id && member.artwork_series) {
          seriesMap.set(member.shopify_product_id, member.artwork_series)
        }
      })

      // Fetch edition_size from products table as fallback
      const { data: products } = await supabase
        .from('products')
        .select('product_id, edition_size')
        .in('product_id', productIds);
      
      products?.forEach(p => {
        if (p.edition_size) {
          productTotalMap.set(p.product_id.toString(), parseInt(p.edition_size.toString()));
        }
      });
    }

    // 6. Map to CollectorEdition format
    const editions: CollectorEdition[] = allLineItems
      .filter((li: any) => {
        const isValidOrder = !['restocked', 'canceled'].includes(li.order_fulfillment_status) && 
                           !['refunded', 'voided'].includes(li.order_financial_status);
        
        // Robust check for active status
        const isActuallyActive = li.status !== 'inactive' && 
                               li.status !== 'removed' &&
                               li.restocked !== true && 
                               (li.refund_status === 'none' || li.refund_status === null);

        return isActuallyActive && isValidOrder;
      })
      .map((li: any) => {
        const series = li.product_id
          ? seriesMap.get(li.product_id)
          : null

        // Fallback for edition total
        let editionTotal = li.edition_total ? Number(li.edition_total) : null;
        if (!editionTotal && li.product_id) {
          editionTotal = productTotalMap.get(li.product_id.toString()) || null;
        }

        // Determine edition type
        let editionType: "limited" | "open" | "accessory" | null = null
        if (editionTotal && editionTotal > 0) {
          editionType = "limited"
        } else if (li.edition_number !== null) {
          editionType = "open"
        } else {
          editionType = (li.vendor_name === 'Street Collector' || !li.vendor_name) ? "accessory" : "open";
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
          editionNumber: li.edition_number ? Number(li.edition_number) : null,
          editionTotal: editionTotal,
          editionType,
          verificationSource,
          imgUrl: li.img_url,
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
