#!/bin/bash

# Script to apply vendor messages migration directly via Supabase SQL Editor API
# This requires SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF environment variables

set -e

PROJECT_REF="${SUPABASE_PROJECT_REF:-ldmppmnpgdxueebkkpid}"
MIGRATION_FILE="supabase/migrations/20251118000000_vendor_messages.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "Error: Migration file not found: $MIGRATION_FILE"
  exit 1
fi

echo "=== Vendor Messages Migration ==="
echo ""
echo "Migration file: $MIGRATION_FILE"
echo "Project Ref: $PROJECT_REF"
echo ""
echo "To apply this migration:"
echo ""
echo "Option 1: Supabase Dashboard (Recommended)"
echo "1. Go to: https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
echo "2. Copy the contents of: $MIGRATION_FILE"
echo "3. Paste into SQL Editor"
echo "4. Click 'Run'"
echo ""
echo "Option 2: Supabase CLI (if linked)"
echo "Run: supabase db push --include-all"
echo "(Note: You may need to resolve conflicts with existing migrations)"
echo ""
echo "Option 3: psql (if you have database connection string)"
echo "Run: psql \"YOUR_CONNECTION_STRING\" -f $MIGRATION_FILE"
echo ""
echo "=== Migration SQL Preview (first 20 lines) ==="
head -20 "$MIGRATION_FILE"
echo ""
echo "... (see full file for complete migration)"

