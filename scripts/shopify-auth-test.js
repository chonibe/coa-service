const https = require('https');
const crypto = require('crypto');

async function testShopifyAuthentication() {
  console.log('Shopify Authentication Diagnostic Tool');
  
  // Configuration (replace with your actual values)
  const config = {
    shopDomain: process.env.SHOPIFY_SHOP || 'thestreetlamp-9103.myshopify.com',
    clientId: process.env.SHOPIFY_CLIENT_ID,
    redirectUri: process.env.SHOPIFY_REDIRECT_URI || 'https://streetcollector.vercel.app/api/auth/callback',
    scope: 'openid profile email'
  };

  console.log('Configuration Check:');
  console.log('- Shop Domain:', config.shopDomain);
  console.log('- Client ID:', config.clientId ? 'Configured' : 'MISSING');
  console.log('- Redirect URI:', config.redirectUri);

  // Generate a test state for CSRF protection
  const testState = crypto.randomBytes(16).toString('hex');

  // Construct authentication URL
  const authUrl = new URL(`https://${config.shopDomain}/account/login`);
  authUrl.searchParams.set('client_id', config.clientId);
  authUrl.searchParams.set('redirect_uri', config.redirectUri);
  authUrl.searchParams.set('state', testState);
  authUrl.searchParams.set('scope', config.scope);
  authUrl.searchParams.set('response_type', 'code');

  console.log('\nGenerated Authentication URL:');
  console.log(authUrl.toString());

  console.log('\nTesting Recommendations:');
  console.log('1. Open the above URL in a browser');
  console.log('2. Log in with a test customer account');
  console.log('3. Verify redirect to callback URL');
  console.log('4. Check for state parameter preservation');
}

// Run the diagnostic
testShopifyAuthentication().catch(console.error); 