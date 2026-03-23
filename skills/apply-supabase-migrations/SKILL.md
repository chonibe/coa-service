---
name: apply-supabase-migrations
description: Always attempt to apply Supabase migrations via MCP or CLI before prompting manual application. When creating or modifying migration files in supabase/migrations/, automatically try to apply them using available MCP tools (user-supabase or plugin-supabase-supabase) or Supabase CLI, only falling back to manual instructions if all automated methods fail.
---

# Apply Supabase Migrations Automatically

## Default Behavior

**CRITICAL:** Whenever you create, modify, or are asked to apply a migration file in `supabase/migrations/`, you MUST attempt to apply it automatically using available methods before prompting the user for manual application.

## Prerequisites: Pull Environment Variables from Vercel

**CRITICAL:** Before attempting any migration, pull environment variables from Vercel:

```bash
vercel env pull .env.local --environment=production
```

This ensures `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, and other required env vars are available.

## Application Order (Try in this sequence)

1. **Pull env vars from Vercel first:**
   ```bash
   vercel env pull .env.local --environment=production
   ```

2. **Try MCP `apply_migration` tool** (user-supabase server)
   - Server: `user-supabase` or `plugin-supabase-supabase`
   - Tool: `apply_migration`
   - Arguments:
     - `name`: Migration name in snake_case (e.g., `20260315000000_early_access_coupons.sql` → `early_access_coupons`)
     - `query`: Full SQL contents of the migration file

3. **Try MCP `execute_sql` tool** (if apply_migration unavailable)
   - Server: `user-supabase` or `plugin-supabase-supabase`
   - Tool: `execute_sql`
   - Arguments:
     - `query`: Full SQL contents of the migration file

4. **Try Supabase RPC exec_sql** (via Supabase client)
   - Use `supabase.rpc('exec_sql', { sql_query: sql })`
   - Requires `SUPABASE_SERVICE_ROLE_KEY` from `.env.local` (pulled from Vercel)
   - Create/use a script that loads `.env.local` before running

5. **Try Supabase CLI**
   ```bash
   supabase db push
   ```
   Or for specific migration:
   ```bash
   supabase migration up --file <migration_filename>
   ```

6. **Fallback: Manual Instructions**
   Only provide manual instructions if ALL automated methods fail.

## Implementation Steps

When applying a migration:

1. **Pull environment variables from Vercel:**
   ```bash
   vercel env pull .env.local --environment=production
   ```

2. **Read the migration file** from `supabase/migrations/<filename>.sql`
3. **Extract migration name** from filename (remove timestamp prefix)
4. **Try MCP first:**
   ```typescript
   // Try user-supabase server
   call_mcp_tool({
     server: "user-supabase",
     toolName: "apply_migration",
     arguments: {
       name: "early_access_coupons", // snake_case from filename
       query: "<full_sql_content>"
     }
   })
   ```
4. **If that fails, try plugin-supabase-supabase:**
   ```typescript
   call_mcp_tool({
     server: "plugin-supabase-supabase",
     toolName: "apply_migration",
     arguments: { name, query }
   })
   ```
5. **If MCP fails, try Supabase RPC exec_sql:**
   - Create/use a script that loads `.env.local` (from Vercel)
   - Use `supabase.rpc('exec_sql', { sql_query: sql })`
   - Example: `node scripts/apply-<migration-name>-migration.js`
6. **If RPC fails, try CLI:**
   ```bash
   supabase db push
   ```
7. **Only if all fail:** Provide manual instructions with migration SQL

## Migration Name Format

Convert migration filename to snake_case name:
- `20260315000000_early_access_coupons.sql` → `early_access_coupons`
- `20260309100000_experience_quiz_signups_customer_id.sql` → `experience_quiz_signups_customer_id`

Strip the timestamp prefix (format: `YYYYMMDDHHMMSS_`) before the underscore.

## Error Handling

- If MCP tool not found: Try next method (other MCP server or CLI)
- If MCP returns error: Log error and try CLI
- If CLI not configured: Provide manual instructions with full SQL
- Always report success/failure to user

## Examples

### Example 1: Successful MCP Application
```
✅ Migration applied successfully via MCP (user-supabase)
Table 'early_access_coupons' created with indexes and RLS policies.
```

### Example 2: MCP Failed, CLI Success
```
⚠️  MCP application failed: Tool not found
✅ Migration applied successfully via Supabase CLI
```

### Example 3: All Methods Failed
```
❌ Automated migration application failed:
   - MCP tools not available
   - CLI not configured
   
📝 Please apply manually via Supabase Dashboard:
   1. Go to Supabase Dashboard > SQL Editor
   2. Copy contents of: supabase/migrations/20260315000000_early_access_coupons.sql
   3. Paste and execute
```

## When to Use

- After creating any new migration file
- When user asks to "apply migration" or "run migrations"
- When modifying existing migration files
- As part of feature implementation that requires schema changes

## Notes

- Always read the migration file content before attempting to apply
- Escape single quotes in SQL if needed when passing to MCP
- Verify migration was applied by checking for success response
- Don't prompt user for manual application unless all automated methods fail
