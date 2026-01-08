const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const path = require("path");
const axios = require("axios");

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function forceProcessPayouts() {
  console.log("=== Force Processing Stuck Payouts ===");
  
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const environment = process.env.PAYPAL_ENVIRONMENT || "sandbox";
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  const baseUrl = environment === 'production' 
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  const payoutIds = [17]; // Process the new stuck ID

  try {
    // 1. Get PayPal Token
    console.log("Authenticating with PayPal...");
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenResponse = await axios({
      url: `${baseUrl}/v1/oauth2/token`,
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      data: 'grant_type=client_credentials',
    });
    const accessToken = tokenResponse.data.access_token;
    console.log("✅ PayPal Authenticated.");

    for (const id of payoutIds) {
      console.log(`\nProcessing Payout ID: ${id}...`);
      
      // 2. Fetch payout details from DB
      const { data: payout, error: fetchError } = await supabase
        .from("vendor_payouts")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError || !payout) {
        console.error(`❌ Could not find payout ${id}`);
        continue;
      }

      // 3. Get vendor's PayPal email
      const { data: vendor } = await supabase
        .from("vendors")
        .select("paypal_email")
        .eq("vendor_name", payout.vendor_name)
        .single();

      if (!vendor?.paypal_email) {
        console.error(`❌ Vendor ${payout.vendor_name} has no PayPal email.`);
        continue;
      }

      // 4. Create PayPal Payout
      const senderBatchId = `FORCE-${Date.now()}-${id}`;
      const payoutRequest = {
        sender_batch_header: {
          sender_batch_id: senderBatchId,
          email_subject: 'Your payout from COA Service',
        },
        items: [{
          recipient_type: 'EMAIL',
          amount: { value: payout.amount.toFixed(2), currency: 'USD' },
          receiver: vendor.paypal_email,
          note: `Stuck Payout Ref: ${payout.reference}`,
          sender_item_id: payout.reference,
        }],
      };

      console.log(`Sending $${payout.amount} to ${vendor.paypal_email}...`);
      
      const paypalResponse = await axios({
        url: `${baseUrl}/v1/payments/payouts`,
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        data: payoutRequest,
      });

      const batchId = paypalResponse.data.batch_header.payout_batch_id;
      console.log(`✅ PayPal Payout Created. Batch ID: ${batchId}`);

      // 5. Update Database
      const { error: updateError } = await supabase
        .from("vendor_payouts")
        .update({
          status: "processing",
          payout_batch_id: batchId,
          payment_id: batchId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (updateError) {
        console.error(`❌ DB Update failed for ${id}:`, updateError.message);
      } else {
        console.log(`✅ DB updated to 'processing'. Run the webhook simulator next!`);
      }
    }

  } catch (error) {
    console.error("❌ Force Process Failed:", error.response?.data || error.message);
  }
}

forceProcessPayouts();

