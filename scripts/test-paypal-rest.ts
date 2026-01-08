import { createPayPalClient } from "../lib/paypal/client";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function testPayPalAuth() {
  console.log("=== PayPal REST API Connectivity Test ===");
  console.log(`Environment: ${process.env.PAYPAL_ENVIRONMENT || "sandbox"}`);
  console.log(`Client ID: ${process.env.PAYPAL_CLIENT_ID ? "✓ SET" : "✗ MISSING"}`);
  console.log(`Client Secret: ${process.env.PAYPAL_CLIENT_SECRET ? "✓ SET" : "✗ MISSING"}`);

  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    console.error("\n❌ ERROR: PayPal credentials not found in environment.");
    console.log("Please ensure PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are in your .env file.");
    process.exit(1);
  }

  try {
    const client = createPayPalClient();
    console.log("\nAttempting to fetch OAuth access token...");
    
    const token = await client.getAccessToken();
    
    console.log("✅ SUCCESS: Successfully authenticated with PayPal!");
    console.log(`Access Token: ${token.substring(0, 15)}... (truncated)`);
    
    // Test a basic API call (getting account info if possible or just verifying token)
    console.log("\nTesting API request capability...");
    // Just a simple GET to verify connectivity
    // Using a simple endpoint that doesn't require specific permissions
    // /v1/notifications/webhooks is usually available
    try {
      const response = await client.request("/v1/notifications/webhooks", {
        method: "GET",
      });
      console.log("✅ SUCCESS: Successfully reached PayPal API endpoints!");
    } catch (apiError: any) {
      // If webhooks endpoint fails due to lack of permissions, authentication was still successful
      if (apiError.message.includes("403")) {
        console.log("⚠️ API Call Note: Token is valid, but this specific test endpoint returned 403 Forbidden.");
        console.log("This is often normal if your app doesn't have Webhook management permissions enabled.");
      } else {
        throw apiError;
      }
    }

  } catch (error: any) {
    console.error("\n❌ ERROR: PayPal Connectivity Test Failed");
    console.error(error.message);
    if (error.message.includes("401")) {
      console.log("\nSuggestion: Double-check your Client ID and Client Secret in the PayPal Dashboard.");
    }
    process.exit(1);
  }
}

testPayPalAuth();

