-- Fix Release Notes Technical Details
-- The first migration overwrote technical details, so we need to fix this

-- Update the Vercel AI Gateway Integration record
UPDATE public.platform_updates
SET
  stakeholder_summary = 'Integrated Vercel AI SDK and Gateway, replacing placeholder insights logic with live OpenAI calls.',
  technical_details = 'Configured Vercel AI Gateway client in lib/ai/gateway.ts. Implemented Insights API endpoint at /api/crm/ai/insights. Replaced placeholder insights with live OpenAI API calls.',
  impact_level = 'low',
  is_breaking = false
WHERE title = 'Vercel AI Gateway Integration';

-- Update the Vendor Dashboard Hardening record
UPDATE public.platform_updates
SET
  stakeholder_summary = 'Introduced signed vendor sessions, Supabase-aligned analytics, and GBP-consistent dashboards for enhanced security and reliability.',
  technical_details = 'Implemented HMAC-backed signed session tokens. Updated vendor analytics to use order_line_items_v2 data. Migrated vendor login to Supabase Google OAuth with enhanced session security.',
  impact_level = 'medium',
  is_breaking = false
WHERE title = 'Vendor Dashboard Hardening';

-- Update the Admin Portal UX Refresh record
UPDATE public.platform_updates
SET
  stakeholder_summary = 'Grouped navigation, added command palette, refreshed admin home overview, and improved vendor explorer with better filters and states.',
  technical_details = 'Enhanced admin-shell.tsx with grouped navigation and command palette. Updated admin page.tsx with new overview cards. Improved vendor explorer with sticky filters and preset status chips.',
  impact_level = 'medium',
  is_breaking = false
WHERE title = 'Admin Portal UX Refresh';

-- Update the ChinaDivision Auto-Fulfillment record
UPDATE public.platform_updates
SET
  stakeholder_summary = 'Orders processed by our warehouse now automatically trigger Shopify fulfillment, generate tracking links, and notify customers via email.',
  technical_details = 'Webhook integration with ChinaDivision status changes. Automated creation of tracking links in Supabase and fulfillment objects in Shopify API. Added /api/warehouse/orders/auto-fulfill endpoint.',
  impact_level = 'high',
  is_breaking = false
WHERE title = 'ChinaDivision Auto-Fulfillment';

-- Update the Collector dashboard launch record
UPDATE public.platform_updates
SET
  stakeholder_summary = 'A beautiful new home for collectors to view their owned artworks, track artist journeys, and manage their credits and subscriptions.',
  technical_details = 'Created /api/collector/dashboard aggregator. Built responsive UI for artwork grids, series binders, and authentication queues. Integrated Google Auth for collectors at /api/auth/collector/google.',
  impact_level = 'high',
  is_breaking = false
WHERE title = 'Collector dashboard launch';

-- Update the CRM Apollo foundations record
UPDATE public.platform_updates
SET
  stakeholder_summary = 'Admins can now manage leads, automate follow-ups with sequences, and track deals through a visual pipeline. Includes an integrated inbox for conversation assignment.',
  technical_details = 'Implementation of sequences/tasks/deals data model, sequence enroll/outbox APIs, deal pipeline CRUD, and conversation assignment logic. Routes: /api/crm/* with comprehensive admin UI.',
  impact_level = 'high',
  is_breaking = false
WHERE title = 'CRM Apollo foundations';

-- Update the NFC unlock flow record
UPDATE public.platform_updates
SET
  stakeholder_summary = 'Collectors can now securely verify physical products via NFC scans. Artists can set exclusive content that only unlocks upon a verified tap.',
  technical_details = 'Added NTAG424 CMAC verification, /api/nfc-tags/sign endpoint for URL issuance, and token-aware redirect handlers. Integration with artwork-series model for locked content at /nfc/unlock.',
  impact_level = 'critical',
  is_breaking = false
WHERE title = 'NFC unlock flow + NTAG424 signing';

-- Update the Marketplace Reliability record
UPDATE public.platform_updates
SET
  stakeholder_summary = 'Updated collector marketplace, product, series, and artist APIs to use existing vendor profile columns for profile image/website/instagram data.',
  technical_details = 'Fixed collector API endpoints to use correct vendor profile column references. Resolved Supabase column errors in marketplace data aggregation. Updated /api/collector/marketplace.',
  impact_level = 'medium',
  is_breaking = false
WHERE title = 'Collector vendor profile fix';

-- Update the Historical Price Correction record
UPDATE public.platform_updates
SET
  stakeholder_summary = 'Corrected historical data inconsistencies from when the platform used different currency formats, ensuring accurate reporting for all vendors.',
  technical_details = 'Implemented migration to force $40 revenue and $10 payout for items before October 2025. Adjusted ledger and line items with metadata audit trail for historical accuracy.',
  impact_level = 'medium',
  is_breaking = false
WHERE title = 'Historical Price Correction (Pre-Oct 2025)';
