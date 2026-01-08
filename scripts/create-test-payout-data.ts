import { createClient } from "../lib/supabase/server";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function createTestData() {
  console.log("=== Creating Payout Test Data ===");
  
  const supabase = createClient();
  const TEST_VENDOR_NAME = "Test Artisan";
  const TEST_PAYPAL_EMAIL = "sb-htevf48617844@business.example.com"; // From your screenshot

  try {
    // 1. Ensure test vendor exists
    console.log(`Checking if vendor "${TEST_VENDOR_NAME}" exists...`);
    const { data: existingVendor } = await supabase
      .from("vendors")
      .select("id, vendor_name")
      .eq("vendor_name", TEST_VENDOR_NAME)
      .maybeSingle();

    if (existingVendor) {
      console.log(`✅ Vendor "${TEST_VENDOR_NAME}" already exists (ID: ${existingVendor.id})`);
    } else {
      console.log(`Creating vendor "${TEST_VENDOR_NAME}"...`);
      const { data: newVendor, error: vendorError } = await supabase
        .from("vendors")
        .insert({
          vendor_name: TEST_VENDOR_NAME,
          contact_email: "test@example.com",
          paypal_email: TEST_PAYPAL_EMAIL,
          status: "active",
          onboarding_completed: true,
        })
        .select()
        .single();

      if (vendorError) throw vendorError;
      console.log(`✅ Vendor created successfully (ID: ${newVendor.id})`);
    }

    // 2. Create mock fulfilled order
    const orderId = `TEST-ORD-${Date.now()}`;
    const lineItemId = `TEST-LI-${Date.now()}`;
    
    console.log(`Inserting mock fulfilled order ${orderId}...`);
    
    // First insert into orders table (needed for financial_status check in pending-items API)
    const { error: orderError } = await supabase
      .from("orders")
      .insert({
        id: orderId,
        name: `#${orderId}`,
        financial_status: "paid",
        fulfillment_status: "fulfilled",
        created_at: new Date().toISOString(),
        total_price: 100.00,
        currency: "USD",
      });

    if (orderError) throw orderError;

    // Then insert into order_line_items_v2
    const { error: lineItemError } = await supabase
      .from("order_line_items_v2")
      .insert({
        line_item_id: lineItemId,
        order_id: orderId,
        order_name: `#${orderId}`,
        vendor_name: TEST_VENDOR_NAME,
        name: "Test Artwork Product",
        price: 40.00,
        quantity: 1,
        fulfillment_status: "fulfilled",
        restocked: false,
        status: "active",
        created_at: new Date().toISOString(),
      });

    if (lineItemError) throw lineItemError;
    
    console.log(`✅ Mock order data created successfully!`);
    console.log(`\nNext steps:`);
    console.log(`1. Go to your Admin Dashboard: https://app.thestreetcollector.com/admin/vendors/payouts`);
    console.log(`2. You should see "${TEST_VENDOR_NAME}" in the Pending Payouts list.`);
    console.log(`3. Select it and click "Process Payout" using PayPal.`);

  } catch (error: any) {
    console.error("\n❌ ERROR: Failed to create test data");
    console.error(error.message);
    process.exit(1);
  }
}

createTestData();

