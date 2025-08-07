const fs = require('fs');
const path = require('path');

// Routes that use direct @supabase/supabase-js imports
const directSupabaseRoutes = [
  'app/api/products/route.ts',
  'app/api/sync/new-line-items/route.ts',
  'app/api/sync/line-items/route.ts',
  'app/api/vendor/profile/route.ts',
  'app/api/vendor/sales-analytics/route.ts',
  'app/api/editions/assign-numbers/route.ts',
  'app/api/editions/check-types/route.ts',
  'app/api/editions/assign-all/route.ts',
  'app/api/editions/get-by-line-item/route.ts',
  'app/api/editions/revoke/route.ts',
  'app/api/admin/backup/list/route.ts',
  'app/api/admin/backup/[type]/route.ts',
  'app/api/admin/backup/settings/route.ts',
  'app/api/v1/dashboard/index.ts',
  'app/api/v1/admin/index.ts',
  'app/api/v1/vendor/index.ts',
];

function fixDirectSupabaseImport(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if it's already using the correct import
  if (content.includes('import { createClient } from "@/lib/supabase/server"')) {
    console.log(`✅ Already fixed: ${filePath}`);
    return false;
  }

  let newContent = content;

  // Fix direct @supabase/supabase-js import
  if (content.includes('import { createClient } from \'@supabase/supabase-js\'')) {
    newContent = content.replace(
      'import { createClient } from \'@supabase/supabase-js\'',
      'import { createClient } from \'@/lib/supabase/server\''
    );
  }

  if (content.includes('import { createClient } from "@supabase/supabase-js"')) {
    newContent = content.replace(
      'import { createClient } from "@supabase/supabase-js"',
      'import { createClient } from "@/lib/supabase/server"'
    );
  }

  // Remove direct Supabase client initialization
  newContent = newContent.replace(
    /const supabaseUrl = process\.env\.NEXT_PUBLIC_SUPABASE_URL!?\s*const supabaseServiceKey = process\.env\.SUPABASE_SERVICE_ROLE_KEY!?\s*const supabase = createClient\(supabaseUrl, supabaseServiceKey\)/g,
    ''
  );

  // Add supabase client creation inside functions
  newContent = newContent.replace(
    /export async function (\w+)\([^)]*\)\s*{/g,
    'export async function $1() {\n  const supabase = createClient()\n  '
  );

  // Handle cases where there might be multiple functions
  if (newContent.includes('export async function') && !newContent.includes('const supabase = createClient()')) {
    newContent = newContent.replace(
      /export async function (\w+)\([^)]*\)\s*{/g,
      'export async function $1() {\n  const supabase = createClient()\n  '
    );
  }

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  }

  console.log(`⚠️  No changes needed: ${filePath}`);
  return false;
}

function main() {
  console.log('🔧 Fixing remaining direct Supabase imports in API routes...\n');

  let totalFixed = 0;

  directSupabaseRoutes.forEach(route => {
    if (fixDirectSupabaseImport(route)) {
      totalFixed++;
    }
  });

  console.log(`\n🎉 Fixed ${totalFixed} files!`);
  console.log('\nNext steps:');
  console.log('1. Review the changes');
  console.log('2. Test the API routes');
  console.log('3. Commit and deploy');
}

main(); 