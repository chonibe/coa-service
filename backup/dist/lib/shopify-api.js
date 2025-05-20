"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shopifyFetch = shopifyFetch;
exports.safeJsonParse = safeJsonParse;
const env_1 = require("@/lib/env");
// Simple delay function
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// Function to make rate-limited API calls to Shopify
async function shopifyFetch(url, options = {}, retries = 3) {
    const fullUrl = url.startsWith("https") ? url : `https://${env_1.SHOPIFY_SHOP}/admin/api/2023-10/${url}`;
    // Set default headers
    const headers = {
        "X-Shopify-Access-Token": env_1.SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
        ...options.headers,
    };
    try {
        const response = await fetch(fullUrl, {
            ...options,
            headers,
        });
        // Check for rate limiting
        if (response.status === 429) {
            console.log("Rate limited by Shopify API, retrying after delay...");
            // Get retry-after header or default to 1 second
            const retryAfter = Number.parseInt(response.headers.get("Retry-After") || "1", 10);
            // Wait for the specified time
            await delay(retryAfter * 1000);
            // Retry the request if we have retries left
            if (retries > 0) {
                return shopifyFetch(url, options, retries - 1);
            }
        }
        return response;
    }
    catch (error) {
        console.error("Error making Shopify API request:", error);
        // Retry on network errors
        if (retries > 0) {
            console.log(`Retrying request (${retries} retries left)...`);
            await delay(1000); // Wait 1 second before retrying
            return shopifyFetch(url, options, retries - 1);
        }
        throw error;
    }
}
// Helper function to safely parse JSON responses
async function safeJsonParse(response) {
    try {
        // First check if the response is ok
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API error (${response.status}):`, errorText.substring(0, 200));
            throw new Error(`API error (${response.status}): ${errorText.substring(0, 200)}${errorText.length > 200 ? "..." : ""}`);
        }
        // Get the response text
        const text = await response.text();
        // Check if the response is empty
        if (!text || text.trim() === "") {
            throw new Error("Empty response received");
        }
        // Try to parse as JSON
        try {
            return JSON.parse(text);
        }
        catch (parseError) {
            console.error("JSON parse error:", parseError);
            console.error("Raw response text:", text.substring(0, 200));
            throw new Error(`Invalid JSON response: ${text.substring(0, 200)}${text.length > 200 ? "..." : ""}`);
        }
    }
    catch (error) {
        if (error instanceof SyntaxError) {
            // JSON parse error - already handled above
            throw error;
        }
        throw error;
    }
}
