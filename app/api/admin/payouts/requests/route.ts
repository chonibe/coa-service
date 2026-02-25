import { NextRequest, NextResponse } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient } from "@/lib/supabase/server"
import { calculateMultipleVendorBalances } from "@/lib/vendor-balance-calculator"

export async function GET(request: NextRequest) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") {
    return auth.response
  }

  const supabase = createClient()

  try {
    // Get all payout requests with status "requested"
    const { data: requests, error } = await supabase
      .from("vendor_payouts")
      .select(`
        id,
        vendor_name,
        amount,
        currency,
        reference,
        product_count,
        invoice_number,
        notes,
        created_at,
        updated_at,
        vendors (
          paypal_email,
          contact_name,
          contact_email
        )
      `)
      .eq("status", "requested")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch payout requests: ${error.message}` },
        { status: 500 }
      )
    }

    // Get ledger balances for all requesting vendors
    const vendorNames = [...new Set((requests || []).map((req: any) => req.vendor_name))]
    let balances: Map<string, any>;
    try {
      balances = await calculateMultipleVendorBalances(vendorNames, supabase);
    } catch (balanceErr: any) {
      console.error("Balance calculation failed for requests:", balanceErr.message);
      balances = new Map();
    }

    // Format the response
    const formattedRequests = (requests || []).map((req: any) => {
      const balance = balances.get(req.vendor_name)
      return {
        id: req.id,
        vendorName: req.vendor_name,
        amount: req.amount,
        currency: req.currency || "USD",
        reference: req.reference,
        productCount: req.product_count || 0,
        invoiceNumber: req.invoice_number,
        notes: req.notes,
        createdAt: req.created_at,
        updatedAt: req.updated_at,
        paypalEmail: req.vendors?.paypal_email || null,
        contactName: req.vendors?.contact_name || null,
        contactEmail: req.vendors?.contact_email || null,
        ledgerBalance: balance?.available_balance || 0,
      }
    })

    return NextResponse.json({
      requests: formattedRequests,
      count: formattedRequests.length,
    })
  } catch (error: any) {
    console.error("Error in payout requests API:", error)
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    )
  }
}



