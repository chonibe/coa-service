# Supabase CLI Setup Guide

## Quick Setup

Run the setup script:

```bash
./scripts/setup-supabase-cli.sh
```

This will:
1. Check if you're logged in
2. Link your project to the remote database
3. Optionally sync migration state

## Manual Setup

### 1. Login to Supabase

```bash
supabase login
```

This will open a browser for authentication.

### 2. Link Your Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

To find your project reference ID:
- Go to Supabase Dashboard
- Project Settings > General
- Copy the "Reference ID"

### 3. Sync Migration State (Important!)

If you have migrations already applied on the remote database that aren't tracked locally:

```bash
supabase db remote commit
```

This syncs the remote migration state with your local state, preventing conflicts.

## Applying Migrations

### Push New Migrations

```bash
supabase db push
```

This will push all new migrations that haven't been applied yet.

### Apply a Specific Migration File

If you want to apply just one migration file directly:

```bash
# Read the migration file and pipe it to Supabase
cat supabase/migrations/20251204000009_attio_phase3_phase4_combined.sql | supabase db execute --linked
```

Or use the SQL Editor in Supabase Dashboard (copy-paste method).

## Troubleshooting

### Error: "duplicate key value violates unique constraint"

This means the migration is already applied on the remote database, but Supabase CLI doesn't know about it.

**Solution:**
```bash
# Sync migration state
supabase db remote commit
```

### Error: "Cannot connect to the Docker daemon"

This happens when Supabase CLI tries to check local Docker status. For remote operations, this is fine - just make sure you're using `--linked` flag or have the project linked.

**Solution:**
- Make sure project is linked: `supabase link --project-ref YOUR_PROJECT_REF`
- Use `--linked` flag for direct SQL execution

### Error: "project not linked"

**Solution:**
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### Error: "not logged in"

**Solution:**
```bash
supabase login
```

## Useful Commands

```bash
# Check project status
supabase projects list

# Link project
supabase link --project-ref PROJECT_REF

# Push migrations
supabase db push

# Sync migration state
supabase db remote commit

# Pull schema from remote
supabase db pull

# Execute SQL directly
echo "SELECT 1;" | supabase db execute --linked
```

## After Setup

Once linked, you can easily apply migrations:

```bash
# Apply the Phase 3 & 4 combined migration
supabase db push
```

Or if you want to apply just one file:

```bash
cat supabase/migrations/20251204000009_attio_phase3_phase4_combined.sql | supabase db execute --linked
```

