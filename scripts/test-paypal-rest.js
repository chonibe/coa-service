const dotenv = require("dotenv");
const path = require("path");
const axios = require("axios");

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function testPayPalAuth() {
  console.log("=== PayPal REST API Connectivity Test (Axios) ===");
  const environment = process.env.PAYPAL_ENVIRONMENT || "sandbox";
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();

  console.log(`Environment: ${environment}`);
  console.log(`Client ID: ${clientId ? "✓ SET" : "✗ MISSING"} (Length: ${clientId?.length})`);
  console.log(`Client Secret: ${clientSecret ? "✓ SET" : "✗ MISSING"} (Length: ${clientSecret?.length})`);

  if (!clientId || !clientSecret) {
    console.error("\n❌ ERROR: PayPal credentials not found in environment.");
    process.exit(1);
  }

  const baseUrl = environment === 'production' 
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

  try {
    console.log("\nAttempting to fetch OAuth access token...");
    
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    console.log(`Auth string length: ${auth.length}`);
    console.log(`Auth string starts with: ${auth.substring(0, 10)}...`);
    
    const response = await axios({
      url: `${baseUrl}/v1/oauth2/token`,
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      data: 'grant_type=client_credentials',
    });

    console.log("✅ SUCCESS: Successfully authenticated with PayPal!");
    console.log(`Access Token: ${response.data.access_token.substring(0, 15)}... (truncated)`);
    
    console.log("\nTesting API request capability (Webhooks list)...");
    const webhookResponse = await axios({
      url: `${baseUrl}/v1/notifications/webhooks`,
      method: 'get',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${response.data.access_token}`,
      },
    });

    console.log("✅ SUCCESS: Successfully reached PayPal API endpoints!");

  } catch (error) {
    console.error("\n❌ ERROR: PayPal Connectivity Test Failed");
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

testPayPalAuth();
