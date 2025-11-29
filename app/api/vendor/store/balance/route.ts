import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `store_balance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`[${requestId}] [store/balance] Request received`, {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
  });

  const supabase = createClient()
  const cookieStore = cookies()
  
  // Log all cookies
  const allCookies = cookieStore.getAll();
  console.log(`[${requestId}] [store/balance] Cookies found:`, {
    count: allCookies.length,
    cookies: allCookies.map(c => ({ name: c.name, value: c.value?.substring(0, 20) + '...' })),
  });

  const vendorName = getVendorFromCookieStore(cookieStore);
  console.log(`[${requestId}] [store/balance] Vendor check:`, {
    vendorName: vendorName || 'null',
  });

  if (!vendorName) {
    console.warn(`[${requestId}] [store/balance] No vendor name found - returning 401`);
    return NextResponse.json(
      { 
        error: "Not authenticated",
        requestId,
      },
      { status: 401 }
    )
  }

  try {
    console.log(`[${requestId}] [store/balance] Fetching vendor from database:`, { vendorName });
    
    // Get vendor info
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, vendor_name, auth_id")
      .eq("vendor_name", vendorName)
      .single()

    console.log(`[${requestId}] [store/balance] Vendor query result:`, {
      found: !!vendor,
      error: vendorError ? {
        code: vendorError.code,
        message: vendorError.message,
        details: vendorError.details,
        hint: vendorError.hint,
      } : null,
      vendor: vendor ? {
        id: vendor.id,
        vendor_name: vendor.vendor_name,
        has_auth_id: !!vendor.auth_id,
        auth_id: vendor.auth_id ? vendor.auth_id.substring(0, 20) + '...' : null,
      } : null,
    });

    if (vendorError || !vendor) {
      console.error(`[${requestId}] [store/balance] Vendor not found:`, {
        vendorName,
        error: vendorError,
      });
      return NextResponse.json(
        { 
          error: "Vendor not found",
          requestId,
          vendorName,
          errorDetails: vendorError ? {
            code: vendorError.code,
            message: vendorError.message,
          } : null,
        },
        { status: 404 }
      )
    }

    // Get vendor's collector identifier (auth_id)
    const collectorIdentifier = vendor.auth_id || vendorName
    console.log(`[${requestId}] [store/balance] Collector identifier:`, {
      collectorIdentifier: collectorIdentifier.substring(0, 20) + '...',
      usedAuthId: !!vendor.auth_id,
    });

    if (!collectorIdentifier) {
      console.error(`[${requestId}] [store/balance] No collector identifier available`);
      return NextResponse.json(
        { 
          error: "Vendor does not have an auth_id",
          requestId,
        },
        { status: 400 }
      )
    }

    // Get USD balance from unified collector banking system
    console.log(`[${requestId}] [store/balance] Fetching USD balance...`);
    const { getUsdBalance } = await import("@/lib/banking/balance-calculator")
    const usdBalance = await getUsdBalance(collectorIdentifier)

    console.log(`[${requestId}] [store/balance] Success - returning balance:`, {
      balance: usdBalance,
      currency: "USD",
      duration: `${Date.now() - startTime}ms`,
    });

    return NextResponse.json({
      success: true,
      balance: usdBalance,
      currency: "USD",
      requestId,
    })
  } catch (error: any) {
    console.error(`[${requestId}] [store/balance] Unexpected error:`, {
      error: error.message,
      stack: error.stack,
      duration: `${Date.now() - startTime}ms`,
    });
    return NextResponse.json(
      { 
        error: "Failed to fetch balance", 
        message: error.message,
        requestId,
      },
      { status: 500 }
    )
  }
}

