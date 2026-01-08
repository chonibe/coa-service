import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session";

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
    // 1. Get the profile to get the authoritative email
    let profileQuery = supabase
      .from("collector_profile_comprehensive")
      .select("*");

    if (collectorId.includes('@')) {
      profileQuery = profileQuery.eq("user_email", collectorId.toLowerCase());
    } else {
      profileQuery = profileQuery.eq("user_id", collectorId);
    }

    const { data: profile, error: profileError } = await profileQuery.maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Collector not found" }, { status: 404 });
    }

    const email = profile.user_email;

    // 2. Fetch orders and line items from v2 tables
    const { data: orders, error: ordersError } = await supabase
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
      .or(`customer_email.eq.${email},customer_id.eq.${profile.pii_sources?.shopify?.id || 'null'}`)
      .order("processed_at", { ascending: false });

    if (ordersError) {
      console.error("[Collector Activity API] Error fetching orders:", ordersError);
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    // 3. Transform data to be more UI-friendly if needed
    // For now, the raw Supabase response is quite close to what we need.
    
    return NextResponse.json({
      orders: orders || [],
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

