# Shopify MCP Server Setup

## Required Environment Variables

The Shopify MCP server requires two environment variables in `.env.local`:

```
SHOPIFY_SHOP=your-shop.myshopify.com
SHOPIFY_ACCESS_TOKEN=your-access-token
```

## Getting Your Shopify Access Token

### Option 1: Admin API Access Token

1. Go to your Shopify Admin
2. Navigate to **Settings** → **Apps and sales channels**
3. Click **Develop apps** (if you haven't created an app yet)
4. Create a new app or select an existing one
5. Go to **API credentials**
6. Under **Admin API access scopes**, configure the scopes you need:
   - `read_products`
   - `read_orders`
   - `read_product_listings`
7. Click **Save**
8. Click **Install app** (if not already installed)
9. Copy the **Admin API access token**

### Option 2: Private App Access Token

1. Go to **Settings** → **Apps and sales channels**
2. Click **Develop apps** → **Allow custom app development**
3. Create a new custom app
4. Configure API scopes (read-only recommended):
   - `read_products`
   - `read_orders`
5. Install the app
6. Copy the **Admin API access token**

## Update .env.local

Once you have your access token, update `.env.local`:

```bash
SHOPIFY_SHOP=thestreetlamp-9103.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Important:** 
- Never commit `.env.local` to version control
- Use read-only scopes for the MCP server (it's read-only anyway)
- The access token should start with `shpat_` for private apps or `shpca_` for custom apps

## Verification

After adding the variables, restart Cursor and test:

1. Ask Cursor agent: "List the first 10 products from Shopify"
2. If it works, you'll see product data
3. If it fails, check:
   - Token is correct
   - Shop domain is correct (should end with `.myshopify.com`)
   - Token has the required scopes

## Security Notes

- The MCP server is read-only (GET requests only)
- Access tokens are stored in `.env.local` (not committed to git)
- Use the minimum required scopes for security
- Rotate tokens periodically

