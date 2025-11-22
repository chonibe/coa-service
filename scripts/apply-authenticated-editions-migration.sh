#!/bin/bash

# Script to apply the preserve authenticated editions migration
# This applies the migration SQL directly to the linked Supabase project

echo "Applying migration: preserve_authenticated_editions.sql"
echo ""

# Read the migration file
MIGRATION_FILE="supabase/migrations/20250115000000_preserve_authenticated_editions.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "Error: Migration file not found: $MIGRATION_FILE"
    exit 1
fi

# Apply using Supabase CLI
# Note: This requires the project to be linked and authenticated
supabase db execute --linked < "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
else
    echo ""
    echo "❌ Migration failed. You may need to:"
    echo "   1. Ensure you're logged in: supabase login"
    echo "   2. Link your project: supabase link --project-ref <your-project-ref>"
    echo "   3. Or apply manually via Supabase Dashboard SQL Editor"
fi

