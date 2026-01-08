const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const path = require("path");
const axios = require("axios");

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function simulateWebhookSuccess() {
  const batchId = process.argv[2];
  
  if (!batchId) {
    console.error("❌ ERROR: Missing batch ID.");
    console.log("Usage: node scripts/simulate-payout-webhook.js <payout_batch_id>");
    process.exit(1);
  }

  console.log(`=== Simulating PayPal Webhook Success for Batch: ${batchId} ===`);
  
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

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

    // 2. Simulate handlePayoutSuccess
    let completedTime = new Date().toISOString();

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
        // We'll simulate the ledger update directly if we can't easily import the lib
        console.log("Updating vendor ledger...");
        const { data: balanceData } = await supabase
          .from("vendors")
          .select("store_balance")
          .eq("vendor_name", payout.vendor_name)
          .single();
        
        const currentBalance = balanceData?.store_balance || 0;
        const newBalance = currentBalance - payout.amount;

        const { error: balanceError } = await supabase
          .from("vendors")
          .update({ store_balance: newBalance })
          .eq("vendor_name", payout.vendor_name);

        if (balanceError) throw balanceError;
        
        // Add ledger entry
        await supabase.from("vendor_ledger").insert({
          vendor_name: payout.vendor_name,
          amount: -payout.amount,
          type: "payout_withdrawal",
          description: `Payout completed - Ref: ${payout.reference}`,
          payout_id: payout.id,
          balance_after: newBalance,
          created_at: new Date().toISOString()
        });

        console.log(`✅ Ledger updated: ${payout.amount} USD withdrawn. New Balance: ${newBalance}`);
      } catch (ledgerError) {
        console.error(`❌ Ledger update failed:`, ledgerError.message);
      }

      // Notifications would usually be handled by Resend/SendGrid in the real webhook
      console.log("✅ Notifications and Invoice generation simulated.");
    }

    console.log("\n=== Simulation Complete ===");
    console.log("The payouts should now show as 'Completed' in both Admin and Vendor dashboards.");

  } catch (error) {
    console.error("\n❌ ERROR: Simulation failed");
    console.error(error.message);
    process.exit(1);
  }
}

simulateWebhookSuccess();

