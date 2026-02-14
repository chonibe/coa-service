import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { EXCLUDED_VENDORS } from "@/lib/payout-calculator"
import { calculateMultipleVendorBalances } from "@/lib/vendor-balance-calculator"

/**
 * GET /api/vendors/payouts/pending
 * Returns all vendors with their current pending payout balances.
 * Now uses ledger-based balances instead of the old RPC function.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get pagination parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // 1. Get all vendors with their metadata
    const { data: vendors, error: vendorError } = await supabase
      .from("vendors")
      .select("vendor_name, paypal_email, tax_id, tax_country, is_company")
      .order("vendor_name");

    if (vendorError) {
      console.error("[pending-payouts] Error fetching vendors:", vendorError);
      throw vendorError;
    }

    // Filter out excluded vendors
    const activeVendors = (vendors || []).filter(
      (v: any) => !EXCLUDED_VENDORS.includes(v.vendor_name)
    );

    const vendorNames = activeVendors.map((v: any) => v.vendor_name);

    // 2. Get ledger-based balances for all vendors
    const balances = await calculateMultipleVendorBalances(vendorNames, supabase);

    // 3. Get product counts from order_line_items_v2 (fulfilled, not paid)
    // Use a lightweight query to count line items per vendor
    const { data: productCounts, error: countError } = await supabase
      .from("order_line_items_v2")
      .select("vendor_name, fulfillment_status")
      .in("vendor_name", vendorNames)
      .eq("restocked", false);

    if (countError) {
      console.error("[pending-payouts] Error fetching product counts:", countError);
    }

    // Aggregate product counts by vendor
    const vendorProductCounts = new Map<string, { ready: number; pending: number }>();
    (productCounts || []).forEach((item: any) => {
      const counts = vendorProductCounts.get(item.vendor_name) || { ready: 0, pending: 0 };
      if (item.fulfillment_status === "fulfilled") {
        counts.ready++;
      } else if (item.fulfillment_status === "unfulfilled" || item.fulfillment_status === "partially_fulfilled") {
        counts.pending++;
      }
      vendorProductCounts.set(item.vendor_name, counts);
    });

    // 4. Get last payout dates
    const { data: lastPayouts, error: payoutError } = await supabase
      .from("vendor_payouts")
      .select("vendor_name, payout_date")
      .eq("status", "completed")
      .order("payout_date", { ascending: false });

    if (payoutError) {
      console.error("[pending-payouts] Error fetching last payouts:", payoutError);
    }

    // Get the most recent payout date per vendor
    const lastPayoutMap = new Map<string, string>();
    (lastPayouts || []).forEach((p: any) => {
      if (!lastPayoutMap.has(p.vendor_name) && p.payout_date) {
        lastPayoutMap.set(p.vendor_name, p.payout_date);
      }
    });

    // 5. Build response — same shape as before for UI compatibility
    const payoutData = activeVendors.map((vendor: any) => {
      const balance = balances.get(vendor.vendor_name);
      const counts = vendorProductCounts.get(vendor.vendor_name) || { ready: 0, pending: 0 };

      return {
        vendor_name: vendor.vendor_name,
        amount: balance?.available_balance || 0,
        product_count: counts.ready,
        pending_fulfillment_count: counts.pending,
        paypal_email: vendor.paypal_email || null,
        tax_id: vendor.tax_id || null,
        tax_country: vendor.tax_country || null,
        is_company: vendor.is_company || false,
        last_payout_date: lastPayoutMap.get(vendor.vendor_name) || null,
      };
    })
      // Only include vendors with non-zero balances or product counts
      .filter((v: any) => v.amount !== 0 || v.product_count > 0 || v.pending_fulfillment_count > 0)
      // Sort by amount descending
      .sort((a: any, b: any) => b.amount - a.amount);

    // Paginate results
    const total = payoutData.length;
    const paginatedData = payoutData.slice(from, to + 1);

    return NextResponse.json({ 
      payouts: paginatedData,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: to < total - 1,
        hasPrev: page > 1
      }
    });

  } catch (error: any) {
    console.error("[pending-payouts] Fatal error in API:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" }, 
      { status: 500 }
    );
  }
}
