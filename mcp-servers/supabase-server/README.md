# Supabase MCP Server

Read-only MCP server for Supabase database access.

## Installation

```bash
npm install
npm run build
```

## Usage

The server is configured in `~/.cursor/mcp.json` and runs automatically when Cursor starts.

## Tools

- `query_schema` - Get database schema information
- `query_table` - Query tables with filters
- `query_relationships` - Discover foreign key relationships
- `test_query` - Validate and test SQL SELECT queries

## Resources

- `supabase://schema` - Complete database schema
- `supabase://table/{tableName}` - Table structure and sample data
- `supabase://relationship/{tableName}` - Foreign key relationships

## Security

- Read-only access only (SELECT queries)
- Blocks INSERT, UPDATE, DELETE, and other write operations
- Limits result sets to 100 rows maximum


