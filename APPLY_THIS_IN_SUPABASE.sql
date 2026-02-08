-- Copy this entire file and run it in Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/ldmppmnpgdxueebkkpid/sql/new

-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('order', 'shipping', 'payout', 'welcome')),
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_key ON email_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_enabled ON email_templates(enabled);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to email_templates" ON email_templates;
CREATE POLICY "Service role full access to email_templates"
  ON email_templates FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Seed templates
DELETE FROM email_templates;

INSERT INTO email_templates (template_key, name, description, category, subject, html_body, variables) VALUES
('order_confirmation', 'Order Confirmation', 'Sent when a customer places an order', 'order', 'Order Confirmation - {{orderName}}', '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #000;">Thank you for your order!</h1><p>Hi {{customerName}},</p><p>We''ve received your order <strong>{{orderName}}</strong> and we''re getting it ready.</p><div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;"><h2 style="margin-top: 0;">Order Details</h2><p><strong>Order Number:</strong> {{orderName}}<br><strong>Total:</strong> {{total}}<br><strong>Date:</strong> {{orderDate}}</p></div><p>We''ll send you a shipping confirmation when your order is on its way.</p><p><a href="{{trackingUrl}}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Track Your Order</a></p><p style="color: #666; font-size: 12px; margin-top: 40px;">Questions? Contact us at support@thestreetcollector.com</p></div></body></html>', '[{"name": "customerName", "description": "Customer full name", "example": "John Doe"}, {"name": "orderName", "description": "Order number", "example": "#1234"}, {"name": "total", "description": "Order total with currency", "example": "$125.00"}, {"name": "orderDate", "description": "Order date", "example": "February 3, 2026"}, {"name": "trackingUrl", "description": "URL to track order", "example": "https://app.thestreetcollector.com/track/abc123"}]'::jsonb),

('shipping_update', 'Shipping Update', 'Sent when order ships or delivery status changes', 'shipping', 'Your order {{orderName}} has shipped!', '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #000;">Your order is on its way! 📦</h1><p>Hi {{customerName}},</p><p>Great news! Your order <strong>{{orderName}}</strong> has been shipped.</p><div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;"><h2 style="margin-top: 0;">Shipping Information</h2><p><strong>Tracking Number:</strong> {{trackingNumber}}<br><strong>Carrier:</strong> {{carrier}}<br><strong>Estimated Delivery:</strong> {{estimatedDelivery}}</p></div><p><a href="{{trackingUrl}}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Track Package</a></p><p style="color: #666; font-size: 12px; margin-top: 40px;">Need help? Contact support@thestreetcollector.com</p></div></body></html>', '[{"name": "customerName", "description": "Customer full name", "example": "John Doe"}, {"name": "orderName", "description": "Order number", "example": "#1234"}, {"name": "trackingNumber", "description": "Shipping tracking number", "example": "1Z999AA10123456784"}, {"name": "carrier", "description": "Shipping carrier name", "example": "UPS"}, {"name": "estimatedDelivery", "description": "Estimated delivery date", "example": "February 10, 2026"}, {"name": "trackingUrl", "description": "URL to track shipment", "example": "https://app.thestreetcollector.com/track/abc123"}]'::jsonb),

('payout_processed', 'Payout Processed', 'Sent when a vendor payout is completed', 'payout', 'Your payout of {{amount}} has been processed', '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #000;">💰 Payout Processed</h1><p>Hi {{vendorName}},</p><p>Your payout has been processed and funds are on their way!</p><div style="background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4caf50;"><h2 style="margin-top: 0; color: #2e7d32;">Payout Details</h2><p style="font-size: 24px; font-weight: bold; margin: 10px 0; color: #2e7d32;">{{amount}}</p><p><strong>Reference:</strong> {{reference}}</p></div><p>Funds typically arrive in 2-5 business days depending on your bank.</p><p><a href="{{payoutsUrl}}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Payout History</a></p><p style="color: #666; font-size: 12px; margin-top: 40px;">Questions? Contact vendor-support@thestreetcollector.com</p></div></body></html>', '[{"name": "vendorName", "description": "Vendor business name", "example": "Acme Art Co"}, {"name": "amount", "description": "Payout amount with currency", "example": "$1,234.56"}, {"name": "reference", "description": "Payout reference number", "example": "PAY-2026-02-03-001"}, {"name": "payoutsUrl", "description": "URL to payouts dashboard", "example": "https://app.thestreetcollector.com/vendor/dashboard/payouts"}]'::jsonb),

('payout_failed', 'Payout Failed', 'Sent when a payout attempt fails', 'payout', 'Action Required: Payout Failed - {{amount}}', '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #d32f2f;">⚠️ Payout Failed</h1><p>Hi {{vendorName}},</p><p>We encountered an issue processing your payout of <strong>{{amount}}</strong>.</p><div style="background: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #d32f2f;"><h2 style="margin-top: 0; color: #c62828;">Error Details</h2><p><strong>Reason:</strong> {{reason}}</p><p><strong>Reference:</strong> {{reference}}</p></div><p><strong>What to do next:</strong></p><ol><li>Check your payment information is correct</li><li>Ensure your bank account is active</li><li>Contact us if you need assistance</li></ol><p><a href="{{payoutsUrl}}" style="background: #d32f2f; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Update Payment Info</a></p><p style="color: #666; font-size: 12px; margin-top: 40px;">Need help? Contact vendor-support@thestreetcollector.com</p></div></body></html>', '[{"name": "vendorName", "description": "Vendor business name", "example": "Acme Art Co"}, {"name": "amount", "description": "Payout amount with currency", "example": "$1,234.56"}, {"name": "reason", "description": "Failure reason", "example": "Invalid bank account"}, {"name": "reference", "description": "Payout reference number", "example": "PAY-2026-02-03-001"}, {"name": "payoutsUrl", "description": "URL to payouts dashboard", "example": "https://app.thestreetcollector.com/vendor/dashboard/payouts"}]'::jsonb),

('payout_pending', 'Payout Pending Reminder', 'Sent to remind vendors about pending payout balance', 'payout', 'Pending Payout Available - {{amount}}', '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #000;">💰 You Have a Pending Payout</h1><p>Hi {{vendorName}},</p><p>You have <strong>{{amount}}</strong> available in pending payouts across <strong>{{pendingItems}}</strong> items.</p><div style="background: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff9800;"><p style="margin: 0;"><strong>Note:</strong> Payouts are automatically processed when your balance reaches {{minimumThreshold}}.</p></div><p><a href="{{payoutsUrl}}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Payout Details</a></p><p style="color: #666; font-size: 12px; margin-top: 40px;">Questions? Contact vendor-support@thestreetcollector.com</p></div></body></html>', '[{"name": "vendorName", "description": "Vendor business name", "example": "Acme Art Co"}, {"name": "amount", "description": "Pending payout amount with currency", "example": "$1,234.56"}, {"name": "pendingItems", "description": "Number of pending items", "example": "15"}, {"name": "minimumThreshold", "description": "Minimum payout threshold amount", "example": "$100.00"}, {"name": "payoutsUrl", "description": "URL to payouts dashboard", "example": "https://app.thestreetcollector.com/vendor/dashboard/payouts"}]'::jsonb),

('refund_deduction', 'Refund Deduction Notice', 'Sent when a refund is deducted from vendor balance', 'payout', 'Refund Deduction Notice - Order {{orderName}}', '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #000;">Refund Processed</h1><p>Hi {{vendorName}},</p><p>A {{refundType}} refund has been processed for order <strong>{{orderName}}</strong>.</p><div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;"><h2 style="margin-top: 0;">Refund Details</h2><p><strong>Deduction Amount:</strong> {{deductionAmount}}<br><strong>New Balance:</strong> {{newBalance}}</p></div><p>This amount has been deducted from your pending payout balance.</p><p><a href="{{payoutsUrl}}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Payout History</a></p><p style="color: #666; font-size: 12px; margin-top: 40px;">Questions? Contact vendor-support@thestreetcollector.com</p></div></body></html>', '[{"name": "vendorName", "description": "Vendor business name", "example": "Acme Art Co"}, {"name": "orderName", "description": "Order number", "example": "#1234"}, {"name": "refundType", "description": "Type of refund (full/partial)", "example": "partial"}, {"name": "deductionAmount", "description": "Amount deducted with currency", "example": "$50.00"}, {"name": "newBalance", "description": "New balance after deduction", "example": "$1,184.56"}, {"name": "payoutsUrl", "description": "URL to payouts dashboard", "example": "https://app.thestreetcollector.com/vendor/dashboard/payouts"}]'::jsonb);

-- System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to system_settings" ON system_settings;
CREATE POLICY "Service role full access to system_settings"
  ON system_settings FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Verify
SELECT 'SUCCESS: Created' || COUNT(*) || ' email templates' as status FROM email_templates;
SELECT '✅ Migrations applied successfully!' as final_status;
