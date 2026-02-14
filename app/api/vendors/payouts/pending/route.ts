import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { EXCLUDED_VENDORS } from "@/lib/payout-calculator"

/**
 * GET /api/vendors/payouts/pending
 *
 * Returns all vendors with their pending payout amounts.
 *
 * **Architecture**: The ledger (`collector_ledger_entries`) is the single source of truth
 * for USD amounts. Line items are only used for product/fulfillment counts.
 *
 * Amount = SUM of all USD ledger entries per vendor (payout_earned - withdrawals - deductions)
 * Counts = from order_line_items_v2 (fulfilled vs pending fulfillment)
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
      .select("vendor_name, paypal_email, tax_id, tax_country, is_company, auth_id")
      .order("vendor_name");

    if (vendorError) {
      console.error("[pending-payouts] Error fetching vendors:", vendorError);
      throw vendorError;
    }

    // Filter out excluded vendors
    const activeVendors = (vendors || []).filter(
      (v: any) => !EXCLUDED_VENDORS.includes(v.vendor_name)
    );

    // Build mapping: collector_identifier → vendor_name
    const identifierToVendor = new Map<string, string>();
    const vendorToIdentifier = new Map<string, string>();
    for (const v of activeVendors) {
      const id = v.auth_id || v.vendor_name;
      identifierToVendor.set(id, v.vendor_name);
      vendorToIdentifier.set(v.vendor_name, id);
    }

    const vendorNames = activeVendors.map((v: any) => v.vendor_name);
    const collectorIdentifiers = Array.from(identifierToVendor.keys());

    // 2. Batch-query ledger balances grouped by collector_identifier
    // Single query: sum all USD entries per collector
    let allLedgerEntries: any[] = [];
    const batchSize = 1000;

    for (let i = 0; i < collectorIdentifiers.length; i += batchSize) {
      const chunk = collectorIdentifiers.slice(i, i + batchSize);
      const { data: entries, error: ledgerError } = await supabase
        .from("collector_ledger_entries")
        .select("collector_identifier, amount")
        .eq("currency", "USD")
        .in("collector_identifier", chunk);

      if (ledgerError) {
        console.error("[pending-payouts] Error fetching ledger entries:", ledgerError);
        continue;
      }

      if (entries) {
        allLedgerEntries = [...allLedgerEntries, ...entries];
      }
    }

    // Sum balances per collector_identifier → vendor_name
    const vendorBalances = new Map<string, number>();
    for (const entry of allLedgerEntries) {
      const vendorName = identifierToVendor.get(entry.collector_identifier);
      if (!vendorName) continue;
      const current = vendorBalances.get(vendorName) || 0;
      vendorBalances.set(vendorName, current + Number(entry.amount || 0));
    }

    // 3. Fetch line item counts per vendor (fulfilled vs pending fulfillment)
    // Only active, non-restocked items that haven't been paid
    let allProductItems: any[] = [];
    let countFrom = 0;
    const countPageSize = 1000;
    let hasMoreCounts = true;

    while (hasMoreCounts) {
      const { data: productBatch, error: countError, count: totalCount } = await supabase
        .from("order_line_items_v2")
        .select("vendor_name, fulfillment_status, line_item_id", { count: "exact" })
        .in("vendor_name", vendorNames)
        .eq("restocked", false)
        .eq("status", "active")
        .range(countFrom, countFrom + countPageSize - 1);

      if (countError) {
        console.error("[pending-payouts] Error fetching product counts:", countError);
        break;
      }

      if (productBatch && productBatch.length > 0) {
        allProductItems = [...allProductItems, ...productBatch];
        countFrom += countPageSize;
        hasMoreCounts = productBatch.length === countPageSize && (totalCount === null || countFrom < totalCount);
      } else {
        hasMoreCounts = false;
      }
    }

    // 4. Get already-paid line item IDs to exclude from counts
    let allPaidIds: string[] = [];
    let paidFrom = 0;
    let hasMorePaid = true;
    while (hasMorePaid) {
      const { data: paidBatch, count: paidCount } = await supabase
        .from("vendor_payout_items")
        .select("line_item_id", { count: "exact" })
        .or("payout_id.not.is.null,manually_marked_paid.eq.true")
        .range(paidFrom, paidFrom + countPageSize - 1);
      if (paidBatch && paidBatch.length > 0) {
        allPaidIds = [...allPaidIds, ...paidBatch.map((r: any) => r.line_item_id)];
        paidFrom += countPageSize;
        hasMorePaid = paidBatch.length === countPageSize && (paidCount === null || paidFrom < paidCount);
      } else {
        hasMorePaid = false;
      }
    }
    const paidLineItemIds = new Set(allPaidIds);

    // 5. Aggregate product counts per vendor (counts only, not amounts)
    const vendorCounts = new Map<string, { ready: number; pending: number }>();

    allProductItems.forEach((item: any) => {
      // Exclude already-paid items from counts
      if (paidLineItemIds.has(item.line_item_id)) return;

      const counts = vendorCounts.get(item.vendor_name) || { ready: 0, pending: 0 };

      if (item.fulfillment_status === "fulfilled") {
        counts.ready++;
      } else if (item.fulfillment_status === "unfulfilled" || item.fulfillment_status === "partially_fulfilled") {
        counts.pending++;
      }

      vendorCounts.set(item.vendor_name, counts);
    });

    // 6. Get last payout dates
    const { data: lastPayouts, error: payoutError } = await supabase
      .from("vendor_payouts")
      .select("vendor_name, payout_date")
      .eq("status", "completed")
      .order("payout_date", { ascending: false });

    if (payoutError) {
      console.error("[pending-payouts] Error fetching last payouts:", payoutError);
    }

    const lastPayoutMap = new Map<string, string>();
    (lastPayouts || []).forEach((p: any) => {
      if (!lastPayoutMap.has(p.vendor_name) && p.payout_date) {
        lastPayoutMap.set(p.vendor_name, p.payout_date);
      }
    });

    // 7. Build response — amount from ledger, counts from line items
    const payoutData = activeVendors.map((vendor: any) => {
      const counts = vendorCounts.get(vendor.vendor_name) || { ready: 0, pending: 0 };
      const ledgerBalance = vendorBalances.get(vendor.vendor_name) || 0;
      // Ensure non-negative (balance can't go below 0)
      const amount = Math.max(0, Math.round(ledgerBalance * 100) / 100);

      return {
        vendor_name: vendor.vendor_name,
        amount,
        product_count: counts.ready,
        pending_fulfillment_count: counts.pending,
        paypal_email: vendor.paypal_email || null,
        tax_id: vendor.tax_id || null,
        tax_country: vendor.tax_country || null,
        is_company: vendor.is_company || false,
        last_payout_date: lastPayoutMap.get(vendor.vendor_name) || null,
      };
    })
      // Only include vendors with non-zero amounts or product counts
      .filter((v: any) => v.amount > 0 || v.product_count > 0 || v.pending_fulfillment_count > 0)
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
