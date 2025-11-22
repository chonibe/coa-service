# MCP Server Implementation

## Overview

This project includes custom Model Context Protocol (MCP) servers that enable Cursor agents to directly access the Supabase database and Shopify store. These servers provide read-only access to schema, data, and relationships, significantly accelerating development workflow.

## Architecture

### Components

1. **Supabase MCP Server** (`mcp-servers/supabase-server/`)
   - Read-only database access
   - Schema inspection tools
   - Query execution (SELECT only)
   - Relationship discovery

2. **Shopify MCP Server** (`mcp-servers/shopify-server/`)
   - Read-only API access
   - Product catalog inspection
   - Order information queries
   - Rate-limited operations

## Setup Instructions

### Prerequisites

1. Node.js 18+ installed
2. Cursor IDE installed
3. Environment variables configured in `.env.local`

### Installation

1. **Install dependencies for both MCP servers:**

```bash
cd mcp-servers/supabase-server
npm install

cd ../shopify-server
npm install
```

2. **Build the TypeScript servers:**

```bash
cd mcp-servers/supabase-server
npm run build

cd ../shopify-server
npm run build
```

3. **Verify environment variables:**

Ensure your `.env.local` file contains:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`)
- `SHOPIFY_SHOP`
- `SHOPIFY_ACCESS_TOKEN`

4. **Configure Cursor:**

The MCP servers are already registered in `~/.cursor/mcp.json`. The configuration uses absolute paths and environment variable placeholders.

**Note:** You may need to update the paths in `~/.cursor/mcp.json` if your project is located elsewhere, or replace `${VARIABLE_NAME}` placeholders with actual values if Cursor doesn't support environment variable expansion.

### Configuration File Location

The Cursor MCP configuration is located at:
```
~/.cursor/mcp.json
```

Example configuration:
```json
{
  "mcpServers": {
    "supabase-custom": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-servers/supabase-server/index.js"],
      "env": {
        "NEXT_PUBLIC_SUPABASE_URL": "your-supabase-url",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY": "your-anon-key"
      }
    },
    "shopify-custom": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-servers/shopify-server/index.js"],
      "env": {
        "SHOPIFY_SHOP": "your-shop.myshopify.com",
        "SHOPIFY_ACCESS_TOKEN": "your-access-token"
      }
    }
  }
}
```

## Usage

### Supabase MCP Server

#### Resources

- `supabase://schema` - Complete database schema information
- `supabase://table/{tableName}` - Table structure and sample data
- `supabase://relationship/{tableName}` - Foreign key relationships

#### Tools

1. **query_schema**
   - Get detailed schema information for all tables or a specific table
   - Returns column names, types, and constraints
   - Example: Query schema for `orders` table

2. **query_table**
   - Query a specific table with optional filters
   - Returns up to 100 rows
   - READ-ONLY - only SELECT queries allowed
   - Example: Get 10 orders with status filter

3. **query_relationships**
   - Discover foreign key relationships for a table
   - Shows which tables reference this table and which tables this table references
   - Example: Find all relationships for `order_line_items_v2`

4. **test_query**
   - Validate and test a SQL SELECT query syntax
   - Returns query plan and sample results
   - READ-ONLY - only SELECT queries allowed
   - Example: Test a complex JOIN query

### Shopify MCP Server

#### Resources

- `shopify://products` - Products catalog overview
- `shopify://product/{id}` - Specific product details
- `shopify://orders` - Orders overview

#### Tools

1. **get_products**
   - List products from Shopify store with pagination support
   - READ-ONLY operation
   - Example: Get first 50 active products

2. **get_product**
   - Get detailed information about a specific product by ID
   - Includes variants, images, and metafields
   - READ-ONLY operation
   - Example: Get product details for product ID "123456"

3. **get_product_metafields**
   - Get metafields for a specific product
   - READ-ONLY operation
   - Example: Get metafields for product ID "123456"

4. **get_orders**
   - List orders from Shopify store
   - Limited to recent orders
   - READ-ONLY operation
   - Example: Get 50 orders with status "any"

## Security Considerations

### Read-Only Access

Both MCP servers enforce read-only access:

**Supabase Server:**
- Blocks INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, TRUNCATE, GRANT, REVOKE, EXEC, EXECUTE, CALL
- Limits result sets to 100 rows maximum
- Validates query syntax before execution
- Uses read-only database credentials (anon key recommended)

**Shopify Server:**
- Only allows GET requests
- Blocks POST, PUT, DELETE, PATCH operations
- Implements rate limiting (2 requests per second)
- Respects Shopify API rate limits

### Environment Isolation

- MCP servers run as separate processes
- Configuration is external to project code
- Uses development credentials by default
- Clear warnings about production access

### Best Practices

1. **Use Anon Key for Supabase:**
   - Prefer `NEXT_PUBLIC_SUPABASE_ANON_KEY` over service role key
   - Anon key respects Row Level Security (RLS) policies
   - Service role key bypasses RLS (use with caution)

2. **Rate Limiting:**
   - Shopify server implements automatic rate limiting
   - Respects Shopify API limits (2 requests/second)
   - Handles 429 responses gracefully

3. **Query Limits:**
   - Supabase queries limited to 100 rows
   - Shopify queries limited to 250 items per request
   - Use pagination for larger datasets

## Troubleshooting

### Server Not Starting

1. **Check Node.js version:**
   ```bash
   node --version  # Should be 18+
   ```

2. **Verify dependencies installed:**
   ```bash
   cd mcp-servers/supabase-server
   npm list
   ```

3. **Check environment variables:**
   - Ensure `.env.local` exists in project root
   - Verify all required variables are set

4. **Check file paths:**
   - Ensure absolute paths in `~/.cursor/mcp.json` are correct
   - Verify `index.js` files exist after building

### Connection Errors

1. **Supabase Connection:**
   - Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
   - Check that anon key or service role key is valid
   - Ensure database is accessible

2. **Shopify Connection:**
   - Verify `SHOPIFY_SHOP` format (should be `shop.myshopify.com`)
   - Check that access token is valid
   - Ensure API access is enabled

### Query Errors

1. **"Only SELECT queries are allowed":**
   - This is expected behavior (read-only enforcement)
   - Use SELECT queries only

2. **"Rate limited by Shopify API":**
   - Server will automatically retry
   - Reduce request frequency if persistent

3. **"Table not found":**
   - Verify table name spelling
   - Check that table exists in database
   - Use `query_schema` to list available tables

### Cursor Not Recognizing Servers

1. **Restart Cursor:**
   - Close and reopen Cursor IDE
   - MCP servers load on startup

2. **Check Configuration:**
   - Verify `~/.cursor/mcp.json` syntax is valid JSON
   - Check that file paths are absolute and correct

3. **Check Logs:**
   - Look for error messages in Cursor's output panel
   - Check server console output (if available)

## Development

### Building Servers

```bash
# Build Supabase server
cd mcp-servers/supabase-server
npm run build

# Build Shopify server
cd ../shopify-server
npm run build
```

### Testing Servers

You can test servers manually by running:

```bash
# Test Supabase server
cd mcp-servers/supabase-server
node index.js

# Test Shopify server
cd mcp-servers/shopify-server
node index.js
```

Note: MCP servers communicate via stdio, so direct execution may not show expected output.

### Adding New Tools

To add new tools to a server:

1. Add tool definition to `ListToolsRequestSchema` handler
2. Add tool implementation to `CallToolRequestSchema` handler
3. Rebuild the server
4. Restart Cursor

## Performance

### Query Performance

- Supabase queries are optimized with limits
- Shopify queries respect API rate limits
- Result sets are limited to prevent memory issues

### Rate Limiting

- Shopify: 2 requests per second (configurable)
- Supabase: No built-in rate limiting (relies on Supabase limits)

## Known Limitations

1. **Complex SQL Queries:**
   - Some complex queries may require using Supabase client methods directly
   - `test_query` tool has limitations with complex JOINs

2. **Relationship Discovery:**
   - Reverse relationships (tables referencing this table) require manual queries
   - Use `test_query` with information_schema queries for complete discovery

3. **Pagination:**
   - Shopify pagination requires manual handling of `pageInfo` tokens
   - Supabase pagination uses limit/offset

## Future Improvements

- [ ] Add support for Supabase RPC functions
- [ ] Implement caching for schema queries
- [ ] Add support for Shopify GraphQL API
- [ ] Implement connection pooling
- [ ] Add query result caching
- [ ] Support for more complex relationship discovery

## Support

For issues or questions:
1. Check this documentation
2. Review server logs
3. Verify environment configuration
4. Check Cursor MCP documentation

## Related Documentation

- [Main README](../README.md)
- [System SSOT](../SYSTEM_SSOT.md) - Critical database relationships
- [API Documentation](../API_DOCUMENTATION.md)


