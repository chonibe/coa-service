# Shopify MCP Server

Read-only MCP server for Shopify store access.

## Installation

```bash
npm install
npm run build
```

## Usage

The server is configured in `~/.cursor/mcp.json` and runs automatically when Cursor starts.

## Tools

- `get_products` - List products with pagination
- `get_product` - Get detailed product information
- `get_product_metafields` - Get product metafields
- `get_orders` - List orders from store

## Resources

- `shopify://products` - Products catalog overview
- `shopify://product/{id}` - Specific product details
- `shopify://orders` - Orders overview

## Security

- Read-only access only (GET requests)
- Automatic rate limiting (2 requests/second)
- Respects Shopify API rate limits


