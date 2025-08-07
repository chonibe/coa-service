const fs = require('fs');
const path = require('path');

// Routes that use regular supabase client (need to be changed to server client)
const regularSupabaseRoutes = [
  'app/api/vendors/names/route.ts',
  'app/api/test-connections/route.ts',
  'app/api/debug/line-items/route.ts',
  'app/api/vendors/custom-data/route.ts',
  'app/api/vendors/list/route.ts',
  'app/api/vendors/sync/route.ts',
  'app/api/cron/sync-shopify-products/route.ts',
  'app/api/sync-vendor-names/route.ts',
  'app/api/cron/sync-shopify-orders/route.ts',
  'app/api/orders/navigation/route.ts',
  'app/api/benefits/claim/route.ts',
  'app/api/benefits/collector/route.ts',
  'app/api/nfc-tags/create/route.ts',
  'app/api/nfc-tags/claim/route.ts',
  'app/api/nfc-tags/redirect/route.ts',
  'app/api/nfc-tags/bulk-create/route.ts',
  'app/api/nfc-tags/assign/route.ts',
  'app/api/nfc-tags/get-programming-data/route.ts',
  'app/api/nfc-tags/list/route.ts',
  'app/api/nfc-tags/delete/route.ts',
  'app/api/nfc-tags/verify/route.ts',
  'app/api/nfc-tags/update-status/route.ts',
  'app/api/shopify/webhook-status/route.ts',
  'app/api/db/exec-sql/route.ts',
  'app/api/shopify/sync-status/route.ts',
  'app/api/shopify/update-edition-sizes/route.ts',
  'app/api/shopify/sync-history/route.ts',
  'app/api/shopify/sync-products/route.ts',
  'app/api/admin/orders/[orderId]/route.ts',
  'app/api/shopify/sync-fulfillments/route.ts',
  'app/api/shopify/manual-sync/route.ts',
  'app/api/shopify/check-missing-orders/route.ts',
  'app/api/shopify/orders/route.ts',
  'app/api/shopify/sync-inventory/route.ts',
  'app/api/shopify/sync-missing-order/route.ts',
  'app/api/certificate/access-logs/route.ts',
  'app/api/certificate/generate/route.ts',
  'app/api/editions/sync-status/route.ts',
  'app/api/editions/resequence/route.ts',
  'app/api/certificate/[lineItemId]/route.ts',
  'app/api/editions/get-edition-number-from-db/route.ts',
  'app/api/sync-vendor-names-single/route.ts',
  'app/api/sync-all-products/route.ts',
  'app/api/customer/certificates/route.ts',
  'app/api/customer/dashboard/route.ts',
  'app/api/customer/dashboard/[customerId]/route.ts',
  'app/api/webhooks/shopify/orders/route.ts',
];

// Routes that use supabaseAdmin (need to be changed to server client)
const adminSupabaseRoutes = [
  'app/api/vendors/payouts/invoice/[id]/route.ts',
  'app/api/vendors/payouts/process-stripe/route.ts',
  'app/api/vendors/payouts/process/route.ts',
  'app/api/stripe/create-account/route.ts',
  'app/api/vendors/payouts/history/route.ts',
  'app/api/vendors/payouts/route.ts',
  'app/api/vendors/init-payout-tables/route.ts',
  'app/api/vendors/all-payouts/route.ts',
  'app/api/vendors/products/route.ts',
  'app/api/stripe/init-tables/route.ts',
  'app/api/vendors/init-payouts-table/route.ts',
  'app/api/stripe/account-status/route.ts',
  'app/api/stripe/onboarding-link/route.ts',
  'app/api/stripe/process-payout/route.ts',
  'app/api/stripe/webhook/route.ts',
  'app/api/vendors/save-payouts/route.ts',
  'app/api/debug/product-vendor-payouts/route.ts',
  'app/api/vendor/stats/sales/route.ts',
  'app/api/vendor/payouts/route.ts',
  'app/api/vendor/login/route.ts',
  'app/api/vendor/stats/route.ts',
  'app/api/vendor/update-paypal/route.ts',
  'app/api/orders/first/route.ts',
  'app/api/certificates/list/route.ts',
  'app/api/certificates/export/route.ts',
  'app/api/certificate/delete/route.ts',
  'app/api/tax-reporting/download-form/[id]/route.ts',
  'app/api/tax-reporting/init-functions/route.ts',
  'app/api/tax-reporting/init-tables/route.ts',
  'app/api/tax-reporting/generate-forms/route.ts',
  'app/api/products/list/route.ts',
  'app/api/tax-reporting/send-form/route.ts',
];

function fixSupabaseImport(filePath) {
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

  // Fix regular supabase import
  if (content.includes('import { supabase } from "@/lib/supabase"')) {
    newContent = content.replace(
      'import { supabase } from "@/lib/supabase"',
      'import { createClient } from "@/lib/supabase/server"'
    );
    
    // Add the createClient() call after the import
    newContent = newContent.replace(
      /export async function (\w+)\(/g,
      'export async function $1('
    );
    
    // Add supabase client creation at the start of each function
    newContent = newContent.replace(
      /export async function (\w+)\([^)]*\)\s*{/g,
      'export async function $1() {\n  const supabase = createClient()\n  '
    );
  }

  // Fix supabaseAdmin import
  if (content.includes('import { supabaseAdmin } from "@/lib/supabase"')) {
    newContent = content.replace(
      'import { supabaseAdmin } from "@/lib/supabase"',
      'import { createClient } from "@/lib/supabase/server"'
    );
    
    // Replace supabaseAdmin with supabase = createClient()
    newContent = newContent.replace(
      /export async function (\w+)\([^)]*\)\s*{/g,
      'export async function $1() {\n  const supabase = createClient()\n  '
    );
    
    // Replace all instances of supabaseAdmin with supabase
    newContent = newContent.replace(/supabaseAdmin/g, 'supabase');
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
  console.log('🔧 Fixing Supabase imports in API routes...\n');

  let totalFixed = 0;

  // Fix regular supabase routes
  console.log('📝 Fixing regular supabase imports...');
  regularSupabaseRoutes.forEach(route => {
    if (fixSupabaseImport(route)) {
      totalFixed++;
    }
  });

  // Fix admin supabase routes
  console.log('\n📝 Fixing admin supabase imports...');
  adminSupabaseRoutes.forEach(route => {
    if (fixSupabaseImport(route)) {
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