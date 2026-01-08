const axios = require("axios");

async function testPayPalAuthHardcoded() {
  console.log("=== PayPal REST API Connectivity Test (HARDCODED) ===");
  const environment = "sandbox";
  const clientId = "AR-VqdAuL0df3xgzY9GLYUrBTeqPXjPLzJsFnlyNrVaafcrv8MnKVhKy_pdGLIhXh5WKM_Cj_TLDT9Sz";
  const clientSecret = "EJpAL2nTxbup21txQ3JHJujdvykoe6bLmy6hTKuKX6MsLL_OdUjRZ1gZsRsjFM74dLSu19WvFcWNNhnw";

  console.log(`Environment: ${environment}`);
  console.log(`Client ID: ${clientId}`);
  console.log(`Client Secret: ${clientSecret}`);

  const baseUrl = 'https://api-m.sandbox.paypal.com';

  try {
    console.log("\nAttempting to fetch OAuth access token...");
    
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
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

testPayPalAuthHardcoded();

