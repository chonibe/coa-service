# MCP Server Verification Guide

## Quick Verification Steps

After restarting Cursor, verify that the MCP servers are working:

### 1. Check Cursor MCP Status

In Cursor, you should see the MCP servers listed. Check the Cursor output/logs for:
- "Supabase MCP server running on stdio"
- "Shopify MCP server running on stdio"

### 2. Test Supabase MCP Server

Try asking Cursor agent:
- "Query the schema for the orders table"
- "Show me the relationships for order_line_items_v2"
- "Get 5 sample rows from the products table"

### 3. Test Shopify MCP Server

Try asking Cursor agent:
- "List the first 10 products from Shopify"
- "Get product details for product ID [your-product-id]"
- "Show me recent orders from Shopify"

## Troubleshooting

### Server Not Starting

1. **Check environment variables:**
   ```bash
   # Verify .env.local exists and has required variables
   cat .env.local | grep -E "SUPABASE|SHOPIFY"
   ```

2. **Verify server files exist:**
   ```bash
   ls -la mcp-servers/supabase-server/index.js
   ls -la mcp-servers/shopify-server/index.js
   ```

3. **Check Cursor config:**
   ```bash
   cat ~/.cursor/mcp.json
   ```

### Environment Variables Not Loading

The servers automatically load from `.env.local` in the project root. If variables aren't loading:

1. Verify `.env.local` is in the project root
2. Check that variable names match exactly:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`)
   - `SHOPIFY_SHOP`
   - `SHOPIFY_ACCESS_TOKEN`

### Shopify Variables Missing

If `SHOPIFY_SHOP` is not found in `.env.local`:

1. Check if they're named differently (e.g., `SHOPIFY_STORE`, `SHOPIFY_DOMAIN`)
2. Add them to `.env.local`:
   ```
   SHOPIFY_SHOP=your-shop.myshopify.com
   SHOPIFY_ACCESS_TOKEN=your-access-token
   ```

## Manual Server Test

You can manually test if servers can load environment variables:

```bash
# Test Supabase server env loading
cd mcp-servers/supabase-server
node -e "
const path = require('path');
const dotenv = require('dotenv');
const currentFile = __filename;
const serverDir = path.dirname(currentFile);
const projectRoot = path.resolve(serverDir, '../..');
const envPath = path.resolve(projectRoot, '.env.local');
dotenv.config({ path: envPath });
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('SUPABASE_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
"
```

## Expected Behavior

When working correctly:
- Cursor agents can query database schema instantly
- Agents can inspect actual data from tables
- Agents can understand table relationships
- Agents can query Shopify products and orders
- All operations are read-only (safe)

## Next Steps

Once verified:
1. Start using MCP tools in your development workflow
2. Ask agents to query schema when building features
3. Use relationship discovery when writing queries
4. Test queries before implementing them

