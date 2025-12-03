#!/bin/bash

# Script to set up Supabase CLI for remote database operations
# This will help you link your project and apply migrations easily

set -e

echo "🔧 Setting up Supabase CLI for remote database operations"
echo ""

# Check if logged in
echo "Step 1: Checking if you're logged in to Supabase..."
if supabase projects list &>/dev/null; then
    echo "✅ Already logged in"
else
    echo "❌ Not logged in. Please log in:"
    echo "   supabase login"
    echo ""
    echo "This will open a browser for authentication."
    read -p "Press Enter after you've logged in, or Ctrl+C to cancel..."
fi

echo ""
echo "Step 2: Linking to your Supabase project..."
echo ""
echo "You'll need your project reference ID."
echo "You can find it in:"
echo "  - Supabase Dashboard > Project Settings > General > Reference ID"
echo ""

read -p "Enter your project reference ID: " PROJECT_REF

if [ -z "$PROJECT_REF" ]; then
    echo "❌ Project reference ID is required"
    exit 1
fi

echo ""
echo "Linking project..."
supabase link --project-ref "$PROJECT_REF"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Project linked successfully!"
    echo ""
    echo "Step 3: Syncing migration state..."
    echo ""
    echo "This will mark all migrations that are already applied on the remote database."
    echo "This prevents conflicts when pushing new migrations."
    echo ""
    read -p "Do you want to sync migration state now? (y/n): " SYNC_MIGRATIONS
    
    if [ "$SYNC_MIGRATIONS" = "y" ] || [ "$SYNC_MIGRATIONS" = "Y" ]; then
        echo ""
        echo "Syncing migration state..."
        supabase db remote commit
        
        if [ $? -eq 0 ]; then
            echo "✅ Migration state synced!"
        else
            echo "⚠️  Migration sync had issues, but you can continue"
        fi
    fi
    
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "You can now use:"
    echo "  - supabase db push          # Push new migrations"
    echo "  - supabase db remote commit # Sync migration state"
    echo "  - supabase db pull          # Pull schema changes"
    echo ""
else
    echo ""
    echo "❌ Failed to link project"
    echo "Make sure:"
    echo "  1. You're logged in: supabase login"
    echo "  2. The project reference ID is correct"
    echo "  3. You have access to the project"
    exit 1
fi

