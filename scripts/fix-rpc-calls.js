const fs = require('fs');
const path = require('path');

// Routes that use RPC calls and might have issues
const rpcRoutes = [
  'app/api/debug/product-vendor-payouts/route.ts',
  'app/api/db/exec-sql/route.ts',
  'app/api/stripe/init-tables/route.ts',
  'app/api/benefits/init-tables/route.ts',
  'app/api/editions/check-types/route.ts',
  'app/api/editions/assign-numbers/route.ts',
  'app/api/editions/assign-all/route.ts',
  'app/api/editions/revoke/route.ts',
  'app/api/tax-reporting/summary/route.ts',
  'app/api/tax-reporting/init-tables/route.ts',
  'app/api/tax-reporting/init-functions/route.ts',
  'app/api/vendors/payouts/process/route.ts',
  'app/api/vendors/payouts/pending/route.ts',
  'app/api/vendors/payouts/pending-items/route.ts',
  'app/api/vendors/init-payout-tables/route.ts',
  'app/api/vendors/init-onboarding-fields/route.ts',
  'app/api/vendors/init-payouts-table/route.ts',
  'app/api/vendors/test-functions/route.ts',
  'app/api/vendors/fix-payout-functions/route.ts',
];

function fixRpcCalls(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if it already has proper error handling
  if (content.includes('try {') && content.includes('await supabase.rpc')) {
    console.log(`✅ Already has proper error handling: ${filePath}`);
    return false;
  }

  let newContent = content;

  // Add proper error handling around RPC calls
  newContent = newContent.replace(
    /const \{ ([^}]+) \} = await supabase\.rpc\(([^)]+)\)/g,
    'let $1;\n    try {\n      const result = await supabase.rpc($2);\n      $1 = result;\n    } catch (error) {\n      console.error("RPC call failed:", error);\n      $1 = { error };\n    }'
  );

  // Handle cases where RPC calls are chained
  newContent = newContent.replace(
    /\.rpc\(([^)]+)\)\.catch\(/g,
    '.rpc($1).then(result => result).catch('
  );

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ Fixed RPC calls: ${filePath}`);
    return true;
  }

  console.log(`⚠️  No changes needed: ${filePath}`);
  return false;
}

function main() {
  console.log('🔧 Fixing RPC calls in API routes...\n');

  let totalFixed = 0;

  rpcRoutes.forEach(route => {
    if (fixRpcCalls(route)) {
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