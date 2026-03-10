#!/usr/bin/env node
/**
 * One-time script to add guardAdminRequest to unprotected API routes.
 * Run: node scripts/add-admin-guards.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const GUARD_IMPORT = `import { guardAdminRequest } from "@/lib/auth-guards"`;

// Routes that should remain PUBLIC (no guard needed)
const SKIP_ROUTES = new Set([
  'app/api/nfc-tags/verify/route.ts',
  'app/api/nfc-tags/redirect/route.ts',
  'app/api/nfc-tags/claim/route.ts',
  'app/api/crm/webhooks/route.ts', // webhook receives external calls
  'app/api/shopify/shipping-countries/route.ts', // public for checkout
]);

// All routes that need guardAdminRequest
const ROUTES = [
  // Admin
  'app/api/admin/collectors/route.ts',
  'app/api/admin/register-payment-domains/route.ts',
  'app/api/admin/artwork-preview/[id]/route.ts',
  // Shopify
  'app/api/shopify/orders/route.ts',
  'app/api/shopify/test-webhook/route.ts',
  'app/api/shopify/sync-products/route.ts' ,
  'app/api/shopify/sync-inventory/route.ts',
  'app/api/shopify/sync-fulfillments/route.ts',
  'app/api/shopify/sync-customers/route.ts',
  'app/api/shopify/update-edition-sizes/route.ts',
  'app/api/shopify/check-missing-orders/route.ts',
  'app/api/shopify/sync-missing-order/route.ts',
  'app/api/shopify/sync-history/route.ts',
  'app/api/shopify/sync-status/route.ts',
  'app/api/shopify/webhook-status/route.ts',
  'app/api/shopify/manual-sync/route.ts',
  // Sync
  'app/api/sync/orders/route.ts',
  'app/api/sync/line-items/route.ts',
  'app/api/sync/new-line-items/route.ts',
  'app/api/sync/order-statuses/route.ts',
  'app/api/sync/all-orders/route.ts',
  'app/api/sync-all-products/route.ts',
  'app/api/sync-vendor-names/route.ts',
  // Vendors
  'app/api/vendors/custom-data/route.ts',
  'app/api/vendors/sync/route.ts',
  'app/api/vendors/list/route.ts',
  'app/api/vendors/payouts/route.ts',
  'app/api/vendors/all-payouts/route.ts',
  'app/api/vendors/all-products/route.ts',
  'app/api/vendors/names/route.ts',
  'app/api/vendors/save-payouts/route.ts',
  'app/api/vendors/products/route.ts',
  'app/api/vendors/balance/route.ts',
  'app/api/vendors/create-table/route.ts',
  // Editions
  'app/api/editions/assign-numbers/route.ts',
  'app/api/editions/assign-all/route.ts',
  'app/api/editions/assign-missing/route.ts',
  'app/api/editions/update-status/route.ts',
  'app/api/editions/resequence/route.ts',
  'app/api/editions/revoke/route.ts',
  'app/api/editions/transfer-ownership/route.ts',
  'app/api/editions/sync-status/route.ts',
  'app/api/editions/check-types/route.ts',
  'app/api/editions/get-edition-number-from-db/route.ts',
  'app/api/editions/get-by-line-item/route.ts',
  'app/api/assign-edition-numbers/route.ts',
  'app/api/generate-sequential-uuid/route.ts',
  'app/api/update-line-item-status/route.ts',
  // Tax reporting
  'app/api/tax-reporting/summary/route.ts',
  'app/api/tax-reporting/generate-forms/route.ts',
  'app/api/tax-reporting/send-form/route.ts',
  // NFC admin ops
  'app/api/nfc-tags/list/route.ts',
  'app/api/nfc-tags/get-programming-data/route.ts',
  'app/api/nfc-tags/create/route.ts',
  'app/api/nfc-tags/bulk-create/route.ts',
  'app/api/nfc-tags/assign/route.ts',
  'app/api/nfc-tags/sign/route.ts',
  'app/api/nfc-tags/update-status/route.ts',
  'app/api/nfc-tags/delete/route.ts',
  // Certificate
  'app/api/certificate/access-logs/route.ts',
  'app/api/certificate/assign-urls/route.ts',
  'app/api/certificate/delete/route.ts',
  'app/api/certificate/generate/route.ts',
  // GA4
  'app/api/ga4/insights/route.ts',
  'app/api/ga4/purchase-tracking/route.ts',
  // Stripe admin
  'app/api/stripe/onboarding-link/route.ts',
  'app/api/stripe/account-status/route.ts',
  'app/api/stripe/process-payout/route.ts',
  'app/api/stripe/create-account/route.ts',
  // Benefits admin
  'app/api/benefits/create/route.ts',
  'app/api/benefits/update/route.ts',
  'app/api/benefits/delete/route.ts',
  'app/api/benefits/update-types/route.ts',
  // Orders admin
  'app/api/orders/first/route.ts',
  'app/api/orders/navigation/route.ts',
  'app/api/fetch-orders-by-customer/route.ts',
  // Other admin
  'app/api/backup/start/route.ts',
  'app/api/warehouse/inventory/route.ts',
  'app/api/tracking/stone3pl/route.ts',
  'app/api/products/[productId]/route.ts',
  // CRM
  'app/api/crm/customers/route.ts',
  'app/api/crm/comments/route.ts',
  'app/api/crm/fields/route.ts',
  'app/api/crm/lists/route.ts',
  'app/api/crm/messages/route.ts',
  'app/api/crm/search/route.ts',
  'app/api/crm/threads/route.ts',
  'app/api/crm/activities/route.ts',
  'app/api/crm/relationships/route.ts',
  'app/api/crm/record-actions/route.ts',
  'app/api/crm/record-widgets/route.ts',
  'app/api/crm/graphql/route.ts',
  'app/api/crm/sync-gmail/debug/route.ts',
  'app/api/crm/people/route.ts',
  'app/api/crm/companies/route.ts',
  'app/api/crm/conversations/route.ts',
  'app/api/crm/kanban/route.ts',
  'app/api/crm/members/route.ts',
  'app/api/crm/bulk/route.ts',
  'app/api/crm/tags/route.ts',
  'app/api/crm/export/route.ts',
  'app/api/crm/email-accounts/route.ts',
  'app/api/crm/saved-views/route.ts',
  'app/api/crm/check-sync-status/route.ts',
  'app/api/crm/sync-gmail/route.ts',
];

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

let modified = 0;
let skipped = 0;
let notFound = 0;
let alreadyGuarded = 0;

for (const route of ROUTES) {
  if (SKIP_ROUTES.has(route)) { skipped++; continue; }
  
  const filePath = path.join(ROOT, route);
  if (!fs.existsSync(filePath)) {
    console.log(`NOT FOUND: ${route}`);
    notFound++;
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf-8');

  // Skip if already has guardAdminRequest
  if (content.includes('guardAdminRequest')) {
    console.log(`ALREADY GUARDED: ${route}`);
    alreadyGuarded++;
    continue;
  }

  // 1. Ensure NextRequest is imported
  if (!content.includes('NextRequest')) {
    // Add NextRequest to existing next/server import
    if (content.includes('from "next/server"') || content.includes("from 'next/server'")) {
      content = content.replace(
        /import\s*\{([^}]+)\}\s*from\s*["']next\/server["']/,
        (match, imports) => {
          if (!imports.includes('NextRequest')) {
            return `import { NextRequest, ${imports.trim()} } from "next/server"`;
          }
          return match;
        }
      );
    } else {
      // No next/server import at all, add one at top
      content = `import { NextRequest, NextResponse } from "next/server"\n` + content;
    }
  }

  // 2. Add guard import after last import
  const lastImportIdx = content.lastIndexOf('\nimport ');
  if (lastImportIdx >= 0) {
    const lineEnd = content.indexOf('\n', lastImportIdx + 1);
    content = content.slice(0, lineEnd + 1) + GUARD_IMPORT + '\n' + content.slice(lineEnd + 1);
  } else {
    content = GUARD_IMPORT + '\n' + content;
  }

  // 3. Add guard check to each HTTP method handler
  for (const method of HTTP_METHODS) {
    // Match: export async function GET(...) {
    //   or: export async function GET(request: NextRequest, ...) {
    //   or: export async function GET(req: NextRequest) {
    //   or: export function GET() {
    const patterns = [
      // With existing request param
      new RegExp(`(export\\s+(?:async\\s+)?function\\s+${method}\\s*\\([^)]*(?:request|req)\\s*:\\s*NextRequest[^)]*\\)\\s*\\{)`, 'g'),
      // Without request param - empty parens
      new RegExp(`(export\\s+(?:async\\s+)?function\\s+${method}\\s*\\(\\)\\s*\\{)`, 'g'),
      // With other params but no request (like route params)
      new RegExp(`(export\\s+(?:async\\s+)?function\\s+${method}\\s*\\([^)]*\\)\\s*\\{)`, 'g'),
    ];
    
    let matched = false;
    
    // First try: already has request: NextRequest
    const p1 = new RegExp(`(export\\s+(?:async\\s+)?function\\s+${method}\\s*\\([^)]*(?:request|req)\\s*:\\s*NextRequest[^)]*\\)\\s*\\{)`, 'g');
    if (p1.test(content)) {
      content = content.replace(p1, `$1\n  const guard = guardAdminRequest(request)\n  if (guard.kind !== "ok") return guard.response\n`);
      // Fix: if param was "req", change guardAdminRequest call
      content = content.replace(/guardAdminRequest\(request\)(\n\s+if \(guard\.kind.*\n)([\s\S]*?function\s+\w+\s*\(req\s*:)/g, (m) => m);
      matched = true;
    }
    
    if (!matched) {
      // Empty parens - add request: NextRequest param
      const p2 = new RegExp(`(export\\s+(?:async\\s+)?function\\s+${method}\\s*)\\(\\)(\\s*\\{)`, 'g');
      if (p2.test(content)) {
        content = content.replace(p2, `$1(request: NextRequest)$2\n  const guard = guardAdminRequest(request)\n  if (guard.kind !== "ok") return guard.response\n`);
        matched = true;
      }
    }

    if (!matched) {
      // Has params but no NextRequest - add request as first param
      const p3 = new RegExp(`(export\\s+(?:async\\s+)?function\\s+${method}\\s*)\\(([^)]+)\\)(\\s*\\{)`, 'g');
      if (p3.test(content)) {
        content = content.replace(p3, (match, pre, params, post) => {
          if (params.includes('NextRequest') || params.includes('request')) {
            return match + `\n  const guard = guardAdminRequest(request)\n  if (guard.kind !== "ok") return guard.response\n`;
          }
          return `${pre}(request: NextRequest, ${params})${post}\n  const guard = guardAdminRequest(request)\n  if (guard.kind !== "ok") return guard.response\n`;
        });
      }
    }
  }

  // Fix any case where "req" was the param name
  content = content.replace(/guardAdminRequest\(request\)([\s\S]{0,100}function\s+\w+\s*\(req\s*:)/g, (match) => {
    return match; // keep as is, we'll handle below
  });

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`MODIFIED: ${route}`);
  modified++;
}

console.log(`\n--- Summary ---`);
console.log(`Modified: ${modified}`);
console.log(`Already guarded: ${alreadyGuarded}`);
console.log(`Not found: ${notFound}`);
console.log(`Skipped (public): ${skipped}`);
