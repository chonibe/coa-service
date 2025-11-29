# Running the Collector Banking System Migrations

This guide explains how to run the database migrations for the unified collector banking system.

## Migration Files (Run in Order)

1. **Base Migration**: `supabase/migrations/20250202000000_collector_banking_system.sql`
   - Creates the core banking system tables and enums
   - **MUST BE RUN FIRST**

2. **Extension Migration**: `supabase/migrations/20250202000002_extend_collector_banking_for_payouts.sql`
   - Extends the system to support USD payouts
   - Adds currency field and payout transaction types
   - **Run after the base migration**

## Option 1: Supabase Dashboard (Recommended - Easiest)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**

### Step 1: Run Base Migration
4. Copy the entire contents of `supabase/migrations/20250202000000_collector_banking_system.sql`
5. Paste it into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Verify the migration completed successfully

### Step 2: Run Extension Migration
8. Copy the entire contents of `supabase/migrations/20250202000002_extend_collector_banking_for_payouts.sql`
9. Paste it into the SQL Editor
10. Click **Run**
11. Verify the migration completed successfully

## Option 2: Supabase CLI

If you have the Supabase CLI installed and your project is linked:

```bash
# Link your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Push all migrations (they will run in order)
supabase db push
```

To get your project ref:
- Go to Supabase Dashboard > Project Settings > General
- Copy the "Reference ID"

## Option 3: psql (Direct Database Connection)

If you have `psql` installed and your database connection string:

```bash
# Get your database connection string from Supabase Dashboard:
# Project Settings > Database > Connection String > URI

# Run the base migration first
psql "YOUR_DATABASE_CONNECTION_STRING" -f supabase/migrations/20250202000000_collector_banking_system.sql

# Then run the extension migration
psql "YOUR_DATABASE_CONNECTION_STRING" -f supabase/migrations/20250202000002_extend_collector_banking_for_payouts.sql
```

## What These Migrations Create

### Base Migration Creates:
1. **collector_accounts** table
   - Stores collector account information
   - Links customers and vendors to their banking accounts

2. **collector_ledger_entries** table
   - Transaction ledger for all credits and USD movements
   - Source of truth for account balances

3. **collector_perk_redemptions** table
   - Tracks perk redemptions (free lamps, proof prints)

4. **collector_credit_subscriptions** table
   - Manages monthly credit subscriptions

5. **Enums**: account types, transaction types, perk types, etc.

6. **Helper functions**: Balance calculation functions

### Extension Migration Adds:
1. **Currency support** to `collector_ledger_entries`
   - Adds `currency` column (CREDITS or USD)
   - Adds `payout_id` column for tracking payout withdrawals

2. **New transaction types**:
   - `payout_earned` - USD deposited when line items are fulfilled
   - `payout_withdrawal` - USD withdrawn when payouts are processed
   - `payout_balance_purchase` - USD spent from payout balance

3. **Enhanced functions**:
   - `get_collector_usd_balance()` - Get USD balance
   - `get_collector_credits_balance()` - Get credits balance
   - `get_collector_unified_balance()` - Get both balances

## Verification

After running the migrations, verify they worked by checking:

1. In Supabase Dashboard > Table Editor, you should see:
   - `collector_accounts`
   - `collector_ledger_entries`
   - `collector_perk_redemptions`
   - `collector_credit_subscriptions`

2. Check that `collector_ledger_entries` has:
   - `currency` column
   - `payout_id` column

3. Try accessing the banking dashboard - it should no longer show the "table does not exist" error

## Troubleshooting

### Error: "relation collector_accounts does not exist"
- **Solution**: Run the base migration first (`20250202000000_collector_banking_system.sql`)

### Error: "type collector_transaction_type does not exist"
- **Solution**: The base migration creates the enum types. Make sure it ran successfully.

### Error: "relation collector_ledger_entries does not exist"
- **Solution**: Run the base migration first. The extension migration checks for table existence, but the base migration must create it.

### Migration runs but tables still don't exist
- Check the Supabase Dashboard > SQL Editor > History for any errors
- Verify you're connected to the correct database
- Check that you have the necessary permissions

## Important Notes

- **Migration Order Matters**: Always run the base migration before the extension migration
- **Idempotent**: Both migrations are designed to be safe to run multiple times (they check for existence before creating)
- **No Data Loss**: These migrations only add new tables and columns - they don't modify existing data

