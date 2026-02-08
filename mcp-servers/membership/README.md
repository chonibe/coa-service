# Membership MCP Server

MCP (Model Context Protocol) server for membership and credits management.

## Purpose

Provides AI agents with controlled access to the membership and credits system through well-defined tools with business rules validation.

## Available Tools

| Tool | Description |
|------|-------------|
| `get_member_status` | Get collector's membership status, tier, and basic credit info |
| `get_credit_balance` | Get detailed credit balance and breakdown by source |
| `deposit_credits` | Add credits to collector account (bonus, refund, adjustment) |
| `redeem_credits` | Deduct credits for purchases or services |
| `get_transaction_history` | Get credit transaction history |
| `get_subscription_details` | Get detailed subscription info including Stripe data |
| `get_membership_analytics` | Get aggregate membership metrics and analytics |

## Business Rules

1. **Credit Deposits**
   - Maximum single deposit: 10,000 credits
   - Requires reason (min 10 characters)
   - Source must be: bonus, refund, adjustment, or promotion

2. **Credit Redemptions**
   - Cannot redeem more than available balance
   - Balance cannot go negative

3. **Analytics**
   - Maximum lookback period: 365 days

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
STRIPE_SECRET_KEY=sk_live_... # Optional, for Stripe subscription details
```

## Installation

```bash
cd mcp-servers/membership
npm install
npm run build
```

## Usage

### With stdio transport (default)

```bash
npm start
```

### Development

```bash
npm run dev
```

## Cursor MCP Configuration

Add to your `~/.cursor/mcp.json`:

```json
{
  "servers": {
    "membership": {
      "command": "node",
      "args": ["path/to/coa-service/mcp-servers/membership/dist/index.js"],
      "env": {
        "NEXT_PUBLIC_SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key",
        "STRIPE_SECRET_KEY": "sk_live_..."
      }
    }
  }
}
```

## Example Usage

```typescript
// Get member status
await callTool('get_member_status', {
  collector_identifier: 'user@example.com'
})

// Deposit credits
await callTool('deposit_credits', {
  collector_identifier: 'user@example.com',
  amount: 100,
  reason: 'Promotional bonus for new member signup',
  source: 'promotion'
})

// Redeem credits
await callTool('redeem_credits', {
  collector_identifier: 'user@example.com',
  amount: 50,
  description: 'Applied to order #12345',
  reference_id: 'order_12345'
})
```

## Security Notes

- Uses service role key for database access (bypasses RLS)
- All operations are logged in ledger entries
- Credit limits prevent abuse
- Tool inputs are validated with Zod schemas
