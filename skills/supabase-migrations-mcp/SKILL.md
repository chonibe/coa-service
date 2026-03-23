---
name: supabase-migrations-mcp
description: Apply Supabase migrations using the Supabase MCP (user-supabase) or Supabase CLI. Use whenever a migration is created, requested, or discussed—apply it automatically via MCP without being asked. Use when the user asks for a migration, schema change, new table, or "run/apply migrations". After writing any new or modified file in supabase/migrations/, apply it in the same turn via MCP apply_migration.
---

# Supabase Migrations via MCP or CLI

## Default behavior

**Whenever the agent creates or is asked to create a migration, it must apply that migration via MCP in the same flow.** Do not leave migrations unapplied; the user expects the database to be updated. No need for the user to say "use the MCP" or "apply it"—just do it.

## When to Apply (automatic)

- **After creating or editing any file in `supabase/migrations/`** — apply it immediately via MCP `apply_migration`.
- User asks for a migration, schema change, new table, new column, or RLS policy — create the migration file, then apply it via MCP.
- User says "apply the migration", "run migrations", "push migrations", or "use MCP for migrations" — apply the relevant migration(s) via MCP (or CLI for bulk).

## Preferred: Supabase MCP (apply_migration)

**Rule:** For every migration file you create or are asked to run, call the MCP `apply_migration` tool so the change is applied to the linked Supabase project. One migration file → one `apply_migration` call with that file’s name and SQL.

1. **Check the MCP tool schema**  
   Read `apply_migration` descriptor (e.g. in project `mcps/user-supabase/tools/apply_migration.json`) to confirm required args: `name`, `query`.

2. **Apply a single migration**
   - **name**: Migration name in **snake_case** derived from the migration filename.  
     Strip the leading timestamp from the filename.  
     Example: `20260309100000_experience_quiz_signups_customer_id.sql` → `experience_quiz_signups_customer_id`
   - **query**: Full contents of the migration file (the SQL only). Read the file from `supabase/migrations/<filename>.sql` and pass it as the `query` string. Escape single quotes in SQL if needed (e.g. `\'` inside string literals).

3. **Call the MCP tool**
   - Server: `user-supabase`
   - Tool: `apply_migration`
   - Arguments: `{ "name": "<snake_case_name>", "query": "<full_sql>" }`

4. **Report result**  
   The tool returns e.g. `{"success": true}`. Confirm to the user that the migration was applied.

## Optional: List applied migrations

To see what’s already applied, call the **list_migrations** tool (server: `user-supabase`, no arguments). Use this when the user asks what migrations have been run or to confirm state before applying.

## Fallback: Supabase CLI

When the user prefers the CLI, or when applying all pending migrations at once:

```bash
# From project root; requires Supabase CLI and linked project
supabase db push
```

Or run a specific migration by name (if your CLI supports it). Ensure `SUPABASE_*` env vars or `supabase link` are set so the CLI targets the correct project.

## Summary

| Goal                    | Method                          |
|-------------------------|----------------------------------|
| Apply one migration     | MCP `apply_migration` (name + query) |
| See applied migrations  | MCP `list_migrations`           |
| Push all pending        | CLI: `supabase db push`         |
