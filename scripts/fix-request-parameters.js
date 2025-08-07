const fs = require('fs');
const path = require('path');

// Routes that use request.nextUrl but might be missing the request parameter
const routesWithRequestIssues = [
  'app/api/cron/sync-shopify-products/route.ts',
  'app/api/customer/dashboard/route.ts',
  'app/api/benefits/list/route.ts',
  'app/api/benefits/delete/route.ts',
  'app/api/benefits/collector/route.ts',
  'app/api/admin/run-cron/route.ts',
  'app/api/shopify/orders/route.ts',
  'app/api/test-url/route.ts',
  'app/api/auth/callback/route.ts',
  'app/api/auth/test-login/route.ts',
  'app/api/auth/test-callback/route.ts',
  'app/api/auth/shopify/route.ts',
  'app/api/certificate/generate/route.ts',
  'app/api/test-connections/route.ts',
  'app/api/test-cron/route.ts',
  'app/api/certificate/[lineItemId]/route.ts',
  'app/api/vendors/products/route.ts',
];

function fixRequestParameter(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if it already has the request parameter
  if (content.includes('export async function GET(request: NextRequest)') || 
      content.includes('export async function POST(request: NextRequest)') ||
      content.includes('export async function PUT(request: NextRequest)') ||
      content.includes('export async function DELETE(request: NextRequest)')) {
    console.log(`✅ Already has request parameter: ${filePath}`);
    return false;
  }

  let newContent = content;

  // Fix GET functions
  newContent = newContent.replace(
    /export async function GET\(\)/g,
    'export async function GET(request: NextRequest)'
  );

  // Fix POST functions
  newContent = newContent.replace(
    /export async function POST\(\)/g,
    'export async function POST(request: NextRequest)'
  );

  // Fix PUT functions
  newContent = newContent.replace(
    /export async function PUT\(\)/g,
    'export async function PUT(request: NextRequest)'
  );

  // Fix DELETE functions
  newContent = newContent.replace(
    /export async function DELETE\(\)/g,
    'export async function DELETE(request: NextRequest)'
  );

  // Add NextRequest import if not present
  if (newContent.includes('request.nextUrl') && !newContent.includes('NextRequest')) {
    newContent = newContent.replace(
      /import \{ ([^}]+) \} from "next\/server"/g,
      'import { $1, NextRequest } from "next/server"'
    );
  }

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ Fixed request parameter: ${filePath}`);
    return true;
  }

  console.log(`⚠️  No changes needed: ${filePath}`);
  return false;
}

function main() {
  console.log('🔧 Fixing request parameters in API routes...\n');

  let totalFixed = 0;

  routesWithRequestIssues.forEach(route => {
    if (fixRequestParameter(route)) {
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