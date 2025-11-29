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
  try {
    const supabase = createClient();
    const cookieStore = cookies();

    // Check if vendor
    const vendorName = getVendorFromCookieStore(cookieStore);
    if (vendorName) {
      // Get vendor details
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('id, vendor_name, contact_email')
        .eq('vendor_name', vendorName)
        .single();

      if (vendorError || !vendor) {
        return NextResponse.json(
          { error: 'Vendor not found' },
          { status: 404 }
        );
      }

      // Try to find vendor's customer_id or account_number from orders
      const { data: vendorOrder } = await supabase
        .from('orders')
        .select('customer_id, account_number')
        .eq('customer_email', vendor.contact_email || '')
        .limit(1)
        .maybeSingle();

      const collectorIdentifier = vendorOrder?.account_number || vendorOrder?.customer_id?.toString() || vendorName;

      return NextResponse.json({
        success: true,
        collectorIdentifier,
        accountType: 'vendor',
        vendorId: vendor.id,
      });
    }

    // Check if customer
    const shopifyCustomerId = request.cookies.get('shopify_customer_id')?.value;
    if (shopifyCustomerId) {
      const customerIdNumber = parseInt(shopifyCustomerId);
      if (!isNaN(customerIdNumber)) {
        // Try to get account_number from orders
        const { data: customerOrder } = await supabase
          .from('orders')
          .select('account_number, customer_id')
          .eq('customer_id', customerIdNumber)
          .limit(1)
          .maybeSingle();

        const collectorIdentifier = customerOrder?.account_number || customerIdNumber.toString();

        return NextResponse.json({
          success: true,
          collectorIdentifier,
          accountType: 'customer',
        });
      }
    }

    return NextResponse.json(
      { error: 'Not authenticated as vendor or customer' },
      { status: 401 }
    );
  } catch (error: any) {
    console.error('Error getting collector identifier:', error);
    return NextResponse.json(
      { error: 'Failed to get collector identifier', message: error.message },
      { status: 500 }
    );
  }
}

