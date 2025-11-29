import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getVendorFromCookieStore } from '@/lib/vendor-session';

/**
 * GET /api/banking/collector-identifier
 * Get collector identifier for the current vendor or customer
 * For vendors: tries to find their customer_id/account_number from orders
 * For customers: uses customer_id from cookie
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`[${requestId}] [collector-identifier] Request received`, {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
  });

  try {
    const supabase = createClient();
    const cookieStore = cookies();

    // Log all cookies
    const allCookies = cookieStore.getAll();
    console.log(`[${requestId}] [collector-identifier] Cookies found:`, {
      count: allCookies.length,
      cookies: allCookies.map(c => ({ name: c.name, value: c.value?.substring(0, 20) + '...' })),
    });

    // Check if vendor
    const vendorName = getVendorFromCookieStore(cookieStore);
    console.log(`[${requestId}] [collector-identifier] Vendor check:`, {
      vendorName: vendorName || 'null',
    });

    if (vendorName) {
      console.log(`[${requestId}] [collector-identifier] Fetching vendor from database:`, { vendorName });
      
      // Get vendor details
      // Note: auth_id may not exist in all databases - we'll check for it separately
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('id, vendor_name')
        .eq('vendor_name', vendorName)
        .single();
      
      // Try to get auth_id separately if the column exists
      let authId: string | null = null;
      if (vendor && !vendorError) {
        try {
          const { data: vendorWithAuth, error: authError } = await supabase
            .from('vendors')
            .select('auth_id')
            .eq('vendor_name', vendorName)
            .single();
          
          if (!authError && vendorWithAuth) {
            authId = vendorWithAuth.auth_id || null;
          }
        } catch (e) {
          // Column doesn't exist - that's okay, we'll use vendor_name
          console.log(`[${requestId}] [collector-identifier] auth_id column not available, using vendor_name`);
        }
      }

      console.log(`[${requestId}] [collector-identifier] Vendor query result:`, {
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
          has_auth_id: !!authId,
          auth_id: authId ? authId.substring(0, 20) + '...' : null,
        } : null,
      });

      if (vendorError || !vendor) {
        console.error(`[${requestId}] [collector-identifier] Vendor not found:`, {
          vendorName,
          error: vendorError,
        });
        return NextResponse.json(
          { 
            error: 'Vendor not found',
            requestId,
            vendorName,
            errorDetails: vendorError ? {
              code: vendorError.code,
              message: vendorError.message,
            } : null,
          },
          { status: 404 }
        );
      }

      // Use auth_id as collector identifier (as established in the banking system)
      // Fallback to vendor_name if auth_id doesn't exist
      const collectorIdentifier = authId || vendorName;
      
      console.log(`[${requestId}] [collector-identifier] Success - returning vendor identifier:`, {
        collectorIdentifier: collectorIdentifier.substring(0, 20) + '...',
        accountType: 'vendor',
        vendorId: vendor.id,
        usedAuthId: !!authId,
        duration: Date.now() - startTime,
      });

      return NextResponse.json({
        success: true,
        collectorIdentifier,
        accountType: 'vendor',
        vendorId: vendor.id,
        requestId,
      });
    }

    // Check if customer
    const shopifyCustomerId = request.cookies.get('shopify_customer_id')?.value;
    console.log(`[${requestId}] [collector-identifier] Customer check:`, {
      shopifyCustomerId: shopifyCustomerId || 'null',
    });

    if (shopifyCustomerId) {
      const customerIdNumber = parseInt(shopifyCustomerId);
      if (!isNaN(customerIdNumber)) {
        console.log(`[${requestId}] [collector-identifier] Fetching customer order:`, { customerIdNumber });
        
        // Try to get account_number from orders
        const { data: customerOrder, error: orderError } = await supabase
          .from('orders')
          .select('account_number, customer_id')
          .eq('customer_id', customerIdNumber)
          .limit(1)
          .maybeSingle();

        console.log(`[${requestId}] [collector-identifier] Customer order query result:`, {
          found: !!customerOrder,
          error: orderError,
          accountNumber: customerOrder?.account_number,
        });

        const collectorIdentifier = customerOrder?.account_number || customerIdNumber.toString();

        console.log(`[${requestId}] [collector-identifier] Success - returning customer identifier:`, {
          collectorIdentifier,
          accountType: 'customer',
          duration: Date.now() - startTime,
        });

        return NextResponse.json({
          success: true,
          collectorIdentifier,
          accountType: 'customer',
          requestId,
        });
      }
    }

    console.warn(`[${requestId}] [collector-identifier] No authentication found:`, {
      hasVendorName: !!vendorName,
      hasShopifyCustomerId: !!shopifyCustomerId,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      { 
        error: 'Not authenticated as vendor or customer',
        requestId,
        details: {
          hasVendorName: !!vendorName,
          hasShopifyCustomerId: !!shopifyCustomerId,
        },
      },
      { status: 401 }
    );
  } catch (error: any) {
    console.error(`[${requestId}] [collector-identifier] Unexpected error:`, {
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime,
    });
    return NextResponse.json(
      { 
        error: 'Failed to get collector identifier', 
        message: error.message,
        requestId,
      },
      { status: 500 }
    );
  }
}

