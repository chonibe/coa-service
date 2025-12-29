import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Vendors excluded from payout calculations (e.g., internal/company vendors)
const EXCLUDED_VENDORS = ["Street Collector", "street collector", "street-collector"]

/**
 * GET /api/vendors/payouts/pending
 * Returns all vendors with their current pending payout balances.
 * Uses get_pending_vendor_payouts() function which includes pending_fulfillment_count.
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

    // Use the database function which includes pending_fulfillment_count
    const { data: payouts, error } = await supabase.rpc('get_pending_vendor_payouts');

    if (error) {
      console.error("[pending-payouts] Error calling get_pending_vendor_payouts:", error);
      throw error;
    }

    // Filter out excluded vendors
    const filteredBalances = (payouts || []).filter((vendor: any) => 
      !EXCLUDED_VENDORS.includes(vendor.vendor_name)
    );

    // Paginate results
    const total = filteredBalances.length;
    const paginatedData = filteredBalances.slice(from, to + 1);

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
