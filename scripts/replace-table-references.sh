#!/bin/bash

# Ensure the script is run from the project root
if [[ ! -d .git ]]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

# Find and replace references
echo "Replacing order_line_items_v2 references..."

# Replace in TypeScript/JavaScript files
find . \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -type f -print0 | xargs -0 sed -i '' 's/order_line_items_v2/order_line_items/g'

# Replace in SQL migration files
find ./supabase/migrations \( -name "*.sql" \) -type f -print0 | xargs -0 sed -i '' 's/order_line_items_v2/order_line_items/g'

# Replace in documentation files
find ./docs \( -name "*.md" \) -type f -print0 | xargs -0 sed -i '' 's/order_line_items_v2/order_line_items/g'

# Replace in backup scripts
find ./backup/scripts \( -name "*.ts" \) -type f -print0 | xargs -0 sed -i '' 's/order_line_items_v2/order_line_items/g'

# Update Supabase types
sed -i '' 's/order_line_items_v2:/order_line_items:/g' ./types/supabase.ts

echo "Replacement complete. Please review changes carefully."
echo "Recommended next steps:"
echo "1. Run tests to verify no broken references"
echo "2. Commit changes"
echo "3. Deploy migration" 