-- Migration: Add collector authentication notification preferences
-- Extends vendor_notification_preferences and vendor_notifications tables

-- Add new notification preference columns
ALTER TABLE vendor_notification_preferences
ADD COLUMN IF NOT EXISTS notify_on_collector_auth BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS weekly_auth_digest BOOLEAN DEFAULT false;

-- Update vendor_notifications type constraint to include collector_authenticated
-- First, drop the existing constraint
ALTER TABLE vendor_notifications
DROP CONSTRAINT IF EXISTS vendor_notifications_type_check;

-- Add new constraint with collector_authenticated type
ALTER TABLE vendor_notifications
ADD CONSTRAINT vendor_notifications_type_check 
CHECK (type IN (
  'new_order', 
  'payout_processed', 
  'product_status_change', 
  'system_announcement', 
  'message_received',
  'collector_authenticated'
));

-- Add comments for documentation
COMMENT ON COLUMN vendor_notification_preferences.notify_on_collector_auth IS 'Whether to receive real-time notifications when collectors authenticate artworks';
COMMENT ON COLUMN vendor_notification_preferences.weekly_auth_digest IS 'Whether to receive weekly email digest of collector authentications';
