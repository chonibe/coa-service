import { createClient } from "../lib/supabase/server";
import { getPayPalPayoutStatus } from "../lib/paypal/payouts";
import { notifyPayoutProcessed } from "../lib/notifications/payout-notifications";
import { sendInvoiceEmail } from "../lib/invoices/email-service";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function simulateWebhookSuccess() {
  const batchId = process.argv[2];
  
  if (!batchId) {
    console.error("❌ ERROR: Missing batch ID.");
    console.log("Usage: npx ts-node scripts/simulate-payout-webhook.ts <payout_batch_id>");
    process.exit(1);
  }

  console.log(`=== Simulating PayPal Webhook Success for Batch: ${batchId} ===`);
  
  const supabase = createClient();

  try {
    // 1. Find payouts with this batch ID
    console.log("Searching for payouts in database...");
    const { data: payouts, error: fetchError } = await supabase
      .from("vendor_payouts")
      .select("*")
      .eq("payout_batch_id", batchId);

    if (fetchError) throw fetchError;
    if (!payouts || payouts.length === 0) {
      console.error(`❌ ERROR: No payouts found with batch ID: ${batchId}`);
      process.exit(1);
    }

    console.log(`Found ${payouts.length} payout(s).`);

    // 2. Try to get status from PayPal (if credentials work)
    let completedTime = new Date().toISOString();
    try {
      console.log("Attempting to fetch actual status from PayPal...");
      const paypalStatus = await getPayPalPayoutStatus(batchId);
      completedTime = paypalStatus.batch_header.time_completed || completedTime;
      console.log(`✅ PayPal status verified: ${paypalStatus.batch_header.batch_status}`);
    } catch (err) {
      console.log("⚠️ Note: Could not fetch status from PayPal API (expected if testing offline). Using current time.");
    }

    // 3. Update each payout (Simulating handlePayoutSuccess)
    for (const payout of payouts) {
      console.log(`\nProcessing payout ID: ${payout.id} for ${payout.vendor_name}...`);
      
      // Update database
      const { error: updateError } = await supabase
        .from("vendor_payouts")
        .update({
          status: "completed",
          payout_date: completedTime,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payout.id);

      if (updateError) throw updateError;
      console.log("✅ Database status updated to 'completed'.");

      // Record withdrawal in ledger
      try {
        const { recordPayoutWithdrawal } = await import("../lib/banking/payout-withdrawal");
        const withdrawalResult = await recordPayoutWithdrawal(
          payout.vendor_name,
          payout.id,
          parseFloat(payout.amount.toString()),
          supabase
        );
        if (withdrawalResult.success) {
          console.log(`✅ Ledger updated: ${withdrawalResult.usdWithdrawn} USD withdrawn.`);
        } else {
          console.error(`❌ Ledger update failed: ${withdrawalResult.error}`);
        }
      } catch (error) {
        console.error(`❌ Error recording withdrawal:`, error);
      }

      // Send notifications
      console.log("Sending notifications...");
      await notifyPayoutProcessed(payout.vendor_name, {
        vendorName: payout.vendor_name,
        amount: parseFloat(payout.amount.toString()),
        currency: payout.currency || "USD",
        payoutDate: completedTime,
        reference: payout.reference || `PAY-${payout.id}`,
        invoiceNumber: payout.invoice_number || undefined,
        productCount: payout.product_count || 0,
        payoutBatchId: batchId,
        invoiceUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/vendors/payouts/${payout.id}/invoice`,
      });
      console.log("✅ Notifications triggered.");

      // Send invoice email
      console.log("Sending invoice email...");
      await sendInvoiceEmail(payout.id, payout.vendor_name);
      console.log("✅ Invoice email triggered.");
    }

    console.log("\n=== Simulation Complete ===");
    console.log("The payouts should now show as 'Completed' in both Admin and Vendor dashboards.");

  } catch (error: any) {
    console.error("\n❌ ERROR: Simulation failed");
    console.error(error.message);
    process.exit(1);
  }
}

simulateWebhookSuccess();

