-- Backfill Real Platform Updates
INSERT INTO public.platform_updates (title, description, category, version, stakeholder_summary, technical_details, impact_level, is_breaking, admin_email)
VALUES 
(
  'CRM Apollo Foundations', 
  'Initial rollout of the Apollo-grade CRM system including sequences, tasks, and deal pipelines.', 
  'feature', 
  '1.1.0', 
  'Admins can now manage leads, automate follow-ups with sequences, and track deals through a visual pipeline. Includes an integrated inbox for conversation assignment.', 
  'Implementation of sequences/tasks/deals data model, sequence enroll/outbox APIs, deal pipeline CRUD, and conversation assignment logic. Routes: /api/crm/*', 
  'high', 
  false, 
  'admin@streetcollector.com'
),
(
  'NFC Unlock & Signing System', 
  'Secure physical-to-digital unlock flow using NTAG424 hardware-level signing.', 
  'feature', 
  '1.1.0', 
  'Collectors can now securely verify physical products via NFC scans. Artists can set exclusive content that only unlocks upon a verified tap.', 
  'Added NTAG424 CMAC verification, /api/nfc-tags/sign endpoint for URL issuance, and token-aware redirect handlers. Integration with artwork-series model for locked content.', 
  'critical', 
  false, 
  'admin@streetcollector.com'
),
(
  'ChinaDivision Auto-Fulfillment', 
  'Automated fulfillment bridge between ChinaDivision and Shopify.', 
  'feature', 
  '1.1.0', 
  'Orders processed by our warehouse now automatically trigger Shopify fulfillment, generate tracking links, and notify customers via email.', 
  'Webhook integration with ChinaDivision status changes. Automated creation of tracking links in Supabase and fulfillment objects in Shopify API.', 
  'high', 
  false, 
  'admin@streetcollector.com'
),
(
  'Collector Dashboard Launch', 
  'New unified interface for collectors to manage their collections and certificates.', 
  'feature', 
  '1.1.0', 
  'A beautiful new home for collectors to view their owned artworks, track artist journeys, and manage their credits and subscriptions.', 
  'Created /api/collector/dashboard aggregator. Built responsive UI for artwork grids, series binders, and authentication queues. Integrated Google Auth for collectors.', 
  'high', 
  false, 
  'admin@streetcollector.com'
),
(
  'Signed Vendor Sessions', 
  'Security hardening for the vendor portal using HMAC-signed session cookies.', 
  'improvement', 
  '1.1.0', 
  'Enhanced security for all vendor accounts, preventing unauthorized access and ensuring data integrity.', 
  'Replaced standard session cookies with HMAC-backed signed tokens. Added guardAdminRequest and guardVendorRequest middleware for consistent auth checking.', 
  'medium', 
  true, 
  'admin@streetcollector.com'
),
(
  'Historical Price Correction', 
  'System-wide alignment of historical revenue and payout data (Pre-Oct 2025).', 
  'fix', 
  '1.1.0', 
  'Corrected historical data inconsistencies from when the platform used different currency formats, ensuring accurate reporting for all vendors.', 
  'Implemented migration to force $40 revenue and $10 payout for legacy items. Adjusted ledger and line items with metadata audit trail for historical accuracy.', 
  'medium', 
  false, 
  'admin@streetcollector.com'
);


