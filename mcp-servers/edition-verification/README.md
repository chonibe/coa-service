# Edition Verification MCP Server

MCP server for verifying edition numbers and tracking provenance.

## Tools

- `verify_edition_number` - Verify edition number exists and get current state
- `get_edition_history` - Get complete event history for an edition
- `get_ownership_history` - Get ownership transfer history
- `check_duplicates` - Check for duplicate edition numbers
- `get_product_editions` - Get all editions for a product with history

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build:
```bash
npm run build
```

3. Configure environment variables in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Usage

Start the server:
```bash
npm start
```

The server communicates via stdio using the MCP protocol.

