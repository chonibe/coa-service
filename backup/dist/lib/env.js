"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_PASSWORD = exports.CERTIFICATE_METAFIELD_ID = exports.CRON_SECRET = exports.SHOPIFY_WEBHOOK_SECRET = exports.SHOPIFY_ACCESS_TOKEN = exports.SHOPIFY_SHOP = void 0;
// Shopify API credentials
exports.SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || "";
exports.SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || "";
exports.SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET || "";
exports.CRON_SECRET = process.env.CRON_SECRET || "";
exports.CERTIFICATE_METAFIELD_ID = process.env.CERTIFICATE_METAFIELD_ID || null;
// Admin password
exports.ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "changeme"; // Default password, change in production
// Validate required environment variables
if (!exports.SHOPIFY_SHOP || !exports.SHOPIFY_ACCESS_TOKEN) {
    console.error("Missing required environment variables for Shopify API");
}
