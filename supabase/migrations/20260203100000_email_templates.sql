-- Migration: Create email_templates table for customizable email content
-- This allows admins to edit email templates without code changes

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT UNIQUE NOT NULL,      -- Unique identifier (e.g., 'order_confirmation')
  name TEXT NOT NULL,                      -- Display name for admin UI
  description TEXT,                        -- Describes when this email is triggered
  category TEXT NOT NULL,                  -- Category: 'order', 'shipping', 'payout', 'welcome'
  subject TEXT NOT NULL,                   -- Email subject line (supports {{variables}})
  html_body TEXT NOT NULL,                 -- HTML email body (supports {{variables}})
  variables JSONB DEFAULT '[]'::jsonb,     -- List of available variables with descriptions
  enabled BOOLEAN DEFAULT true,            -- Whether this template is active
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_enabled ON email_templates(enabled);

-- RLS policies
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Allow authenticated admin users to read/write templates
CREATE POLICY "Allow authenticated read access to email_templates"
  ON email_templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow service role full access to email_templates"
  ON email_templates
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE email_templates IS 'Customizable email templates for automated notifications';
COMMENT ON COLUMN email_templates.template_key IS 'Unique identifier used in code to reference this template';
COMMENT ON COLUMN email_templates.variables IS 'JSON array of {name, description, example} for available template variables';

-- Seed default templates
INSERT INTO email_templates (template_key, name, description, category, subject, html_body, variables) VALUES

-- Order Confirmation
('order_confirmation', 'Order Confirmation', 'Sent when a new paid order is received', 'order', 
'Order Confirmed - {{orderName}}',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f9fafb; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 32px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 64px; height: 64px; background-color: #8217ff15; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 32px;">✓</span>
      </div>
      <h1 style="color: #8217ff; margin: 0 0 8px 0; font-size: 28px;">Thank You for Your Order!</h1>
      <p style="color: #6b7280; margin: 0; font-size: 16px;">Order {{orderName}}</p>
    </div>
    
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; color: #166534;">
        Hi {{customerName}}, we''ve received your order and it''s being processed. 
        You''ll receive updates as your order makes its way to you.
      </p>
    </div>
    
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
      <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #374151;">Track Your Order</h3>
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280;">
        Click the button below to track your order in real-time.
      </p>
      <a href="{{trackingUrl}}" style="display: inline-block; background-color: #8217ff; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 14px;">
        Track Your Order
      </a>
    </div>
    
    <div style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
      <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #374151;">What''s Next?</h4>
      <ul style="margin: 0; padding: 0 0 0 20px; color: #6b7280; font-size: 14px;">
        <li style="margin-bottom: 8px;">We''ll send you an email when your order ships</li>
        <li style="margin-bottom: 8px;">You''ll receive updates when it''s out for delivery</li>
        <li>A final confirmation when it''s delivered</li>
      </ul>
    </div>
    
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">
        Questions about your order? Reply to this email and we''ll help you out.
      </p>
    </div>
  </div>
</body>
</html>',
'[{"name": "orderName", "description": "Order number (e.g., #1234)", "example": "#1234"}, {"name": "customerName", "description": "Customer''s name", "example": "John"}, {"name": "trackingUrl", "description": "URL to the tracking page", "example": "https://app.thestreetcollector.com/track/abc123"}]'::jsonb),

-- Shipping: Shipped
('shipping_shipped', 'Order Shipped', 'Sent when an order is shipped from the warehouse', 'shipping',
'Your order has shipped - {{orderName}}',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f9fafb; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 32px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="font-size: 48px; margin-bottom: 16px;">📦</div>
      <h1 style="color: #8217ff; margin: 0 0 8px 0; font-size: 24px;">Your Order Has Shipped!</h1>
      <p style="color: #6b7280; margin: 0; font-size: 14px;">Order {{orderName}}</p>
    </div>
    
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #374151;">
        Great news! Your order is on its way to {{recipientName}}.
      </p>
      <p style="font-size: 12px; color: #6b7280; font-family: monospace;">
        Tracking: {{trackingNumber}}
      </p>
    </div>
    
    <div style="text-align: center; margin-top: 32px;">
      <a href="{{trackingUrl}}" style="display: inline-block; background-color: #8217ff; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">
        Track Your Order
      </a>
    </div>
    
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">
        You''re receiving this email because you have order tracking notifications enabled.
      </p>
    </div>
  </div>
</body>
</html>',
'[{"name": "orderName", "description": "Order number", "example": "#1234"}, {"name": "recipientName", "description": "Recipient name", "example": "John Smith"}, {"name": "trackingNumber", "description": "Shipping tracking number", "example": "1Z999AA10123456784"}, {"name": "trackingUrl", "description": "URL to tracking page", "example": "https://app.thestreetcollector.com/track/abc123"}]'::jsonb),

-- Shipping: In Transit
('shipping_in_transit', 'Package In Transit', 'Sent when package is moving through delivery network', 'shipping',
'Your package is in transit - {{orderName}}',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f9fafb; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 32px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="font-size: 48px; margin-bottom: 16px;">🚚</div>
      <h1 style="color: #8217ff; margin: 0 0 8px 0; font-size: 24px;">Your Package Is In Transit</h1>
      <p style="color: #6b7280; margin: 0; font-size: 14px;">Order {{orderName}}</p>
    </div>
    
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #374151;">
        Your package is moving through our delivery network on its way to {{recipientName}}.
      </p>
      <p style="font-size: 12px; color: #6b7280; font-family: monospace;">
        Tracking: {{trackingNumber}}
      </p>
    </div>
    
    <div style="text-align: center; margin-top: 32px;">
      <a href="{{trackingUrl}}" style="display: inline-block; background-color: #8217ff; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">
        Track Your Order
      </a>
    </div>
    
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">
        You''re receiving this email because you have order tracking notifications enabled.
      </p>
    </div>
  </div>
</body>
</html>',
'[{"name": "orderName", "description": "Order number", "example": "#1234"}, {"name": "recipientName", "description": "Recipient name", "example": "John Smith"}, {"name": "trackingNumber", "description": "Shipping tracking number", "example": "1Z999AA10123456784"}, {"name": "trackingUrl", "description": "URL to tracking page", "example": "https://app.thestreetcollector.com/track/abc123"}]'::jsonb),

-- Shipping: Out for Delivery
('shipping_out_for_delivery', 'Out for Delivery', 'Sent when package is out for delivery', 'shipping',
'Out for delivery today - {{orderName}}',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f9fafb; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 32px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="font-size: 48px; margin-bottom: 16px;">🏃</div>
      <h1 style="color: #8217ff; margin: 0 0 8px 0; font-size: 24px;">Out for Delivery Today!</h1>
      <p style="color: #6b7280; margin: 0; font-size: 14px;">Order {{orderName}}</p>
    </div>
    
    <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        Exciting news! Your package is out for delivery and should arrive today at {{recipientName}}''s address.
      </p>
    </div>
    
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="font-size: 12px; color: #6b7280; font-family: monospace;">
        Tracking: {{trackingNumber}}
      </p>
    </div>
    
    <div style="text-align: center; margin-top: 32px;">
      <a href="{{trackingUrl}}" style="display: inline-block; background-color: #8217ff; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">
        Track Your Order
      </a>
    </div>
    
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">
        You''re receiving this email because you have order tracking notifications enabled.
      </p>
    </div>
  </div>
</body>
</html>',
'[{"name": "orderName", "description": "Order number", "example": "#1234"}, {"name": "recipientName", "description": "Recipient name", "example": "John Smith"}, {"name": "trackingNumber", "description": "Shipping tracking number", "example": "1Z999AA10123456784"}, {"name": "trackingUrl", "description": "URL to tracking page", "example": "https://app.thestreetcollector.com/track/abc123"}]'::jsonb),

-- Shipping: Delivered
('shipping_delivered', 'Package Delivered', 'Sent when package has been delivered', 'shipping',
'Your package has been delivered - {{orderName}}',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f9fafb; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 32px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
      <h1 style="color: #22c55e; margin: 0 0 8px 0; font-size: 24px;">Your Package Has Been Delivered!</h1>
      <p style="color: #6b7280; margin: 0; font-size: 14px;">Order {{orderName}}</p>
    </div>
    
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; color: #166534;">
        Your package has arrived! We hope you love it.
      </p>
    </div>
    
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="font-size: 12px; color: #6b7280; font-family: monospace;">
        Tracking: {{trackingNumber}}
      </p>
    </div>
    
    <div style="text-align: center; margin-top: 32px;">
      <a href="{{trackingUrl}}" style="display: inline-block; background-color: #8217ff; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">
        View Order Details
      </a>
    </div>
    
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">
        Thank you for your order! We''d love to hear your feedback.
      </p>
    </div>
  </div>
</body>
</html>',
'[{"name": "orderName", "description": "Order number", "example": "#1234"}, {"name": "trackingNumber", "description": "Shipping tracking number", "example": "1Z999AA10123456784"}, {"name": "trackingUrl", "description": "URL to tracking page", "example": "https://app.thestreetcollector.com/track/abc123"}]'::jsonb),

-- Shipping: Alert
('shipping_alert', 'Delivery Alert', 'Sent when there is a delivery issue', 'shipping',
'Delivery alert - action may be required - {{orderName}}',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f9fafb; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 32px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
      <h1 style="color: #ef4444; margin: 0 0 8px 0; font-size: 24px;">Delivery Alert</h1>
      <p style="color: #6b7280; margin: 0; font-size: 14px;">Order {{orderName}}</p>
    </div>
    
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; color: #991b1b;">
        There''s an update about your delivery that may require your attention. Please check the tracking details below.
      </p>
    </div>
    
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="font-size: 12px; color: #6b7280; font-family: monospace;">
        Tracking: {{trackingNumber}}
      </p>
    </div>
    
    <div style="text-align: center; margin-top: 32px;">
      <a href="{{trackingUrl}}" style="display: inline-block; background-color: #ef4444; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">
        View Details
      </a>
    </div>
    
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">
        Need help? Reply to this email and we''ll assist you.
      </p>
    </div>
  </div>
</body>
</html>',
'[{"name": "orderName", "description": "Order number", "example": "#1234"}, {"name": "trackingNumber", "description": "Shipping tracking number", "example": "1Z999AA10123456784"}, {"name": "trackingUrl", "description": "URL to tracking page", "example": "https://app.thestreetcollector.com/track/abc123"}]'::jsonb),

-- Payout Processed
('payout_processed', 'Payout Processed', 'Sent when a vendor payout is successfully processed', 'payout',
'Payout Processed - {{reference}}',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f9fafb; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 32px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="font-size: 48px; margin-bottom: 16px;">💰</div>
      <h1 style="color: #22c55e; margin: 0 0 8px 0; font-size: 24px;">Payout Processed!</h1>
      <p style="color: #6b7280; margin: 0; font-size: 14px;">Reference: {{reference}}</p>
    </div>
    
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; color: #166534;">
        Hi {{vendorName}}, your payout of {{amount}} has been processed successfully.
      </p>
    </div>
    
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <table style="width: 100%;">
        <tr>
          <td style="color: #6b7280; font-size: 14px;">Amount:</td>
          <td style="text-align: right; font-weight: 600;">{{amount}}</td>
        </tr>
        <tr>
          <td style="color: #6b7280; font-size: 14px;">Reference:</td>
          <td style="text-align: right; font-family: monospace;">{{reference}}</td>
        </tr>
      </table>
    </div>
    
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">
        Funds should arrive in your account within 1-3 business days.
      </p>
    </div>
  </div>
</body>
</html>',
'[{"name": "vendorName", "description": "Vendor business name", "example": "Acme Art Co"}, {"name": "amount", "description": "Payout amount with currency", "example": "$1,234.56"}, {"name": "reference", "description": "Payout reference number", "example": "PAY-2024-001234"}]'::jsonb),

-- Payout Failed
('payout_failed', 'Payout Failed', 'Sent when a vendor payout fails', 'payout',
'Payout Failed - {{reference}}',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f9fafb; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 32px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
      <h1 style="color: #ef4444; margin: 0 0 8px 0; font-size: 24px;">Payout Failed</h1>
      <p style="color: #6b7280; margin: 0; font-size: 14px;">Reference: {{reference}}</p>
    </div>
    
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; color: #991b1b;">
        Hi {{vendorName}}, unfortunately your payout of {{amount}} could not be processed.
      </p>
    </div>
    
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="color: #6b7280; font-size: 14px;">Reason: {{reason}}</p>
    </div>
    
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">
        Please contact support if you need assistance.
      </p>
    </div>
  </div>
</body>
</html>',
'[{"name": "vendorName", "description": "Vendor business name", "example": "Acme Art Co"}, {"name": "amount", "description": "Payout amount with currency", "example": "$1,234.56"}, {"name": "reference", "description": "Payout reference number", "example": "PAY-2024-001234"}, {"name": "reason", "description": "Reason for failure", "example": "Invalid bank account details"}]'::jsonb),

-- Payout Pending Reminder
('payout_pending', 'Payout Pending Reminder', 'Sent to remind vendors about pending payout balance', 'payout',
'Pending Payout Available - {{amount}}',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f9fafb; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 32px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="font-size: 48px; margin-bottom: 16px;">💵</div>
      <h1 style="color: #8217ff; margin: 0 0 8px 0; font-size: 24px;">Pending Payout Available</h1>
      <p style="color: #6b7280; margin: 0; font-size: 14px;">{{vendorName}}</p>
    </div>
    
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #374151;">
        Hi {{vendorName}}, you have a pending payout balance ready to be claimed.
      </p>
      <table style="width: 100%;">
        <tr>
          <td style="color: #6b7280; font-size: 14px; padding: 8px 0;">Pending Amount:</td>
          <td style="text-align: right; font-weight: 600; font-size: 18px; color: #22c55e;">{{amount}}</td>
        </tr>
        <tr>
          <td style="color: #6b7280; font-size: 14px; padding: 8px 0;">Pending Items:</td>
          <td style="text-align: right; font-weight: 600;">{{pendingItems}}</td>
        </tr>
      </table>
    </div>
    
    <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 13px; color: #92400e;">
        💡 Minimum payout threshold: {{minimumThreshold}}. Request your payout when you''re ready!
      </p>
    </div>
    
    <div style="text-align: center; margin-top: 32px;">
      <a href="{{payoutsUrl}}" style="display: inline-block; background-color: #8217ff; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">
        Request Payout
      </a>
    </div>
    
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">
        Questions about payouts? Contact us anytime.
      </p>
    </div>
  </div>
</body>
</html>',
'[{"name": "vendorName", "description": "Vendor business name", "example": "Acme Art Co"}, {"name": "amount", "description": "Pending payout amount with currency", "example": "$1,234.56"}, {"name": "pendingItems", "description": "Number of pending items", "example": "15"}, {"name": "minimumThreshold", "description": "Minimum payout threshold amount", "example": "$100.00"}, {"name": "payoutsUrl", "description": "URL to payouts dashboard", "example": "https://app.thestreetcollector.com/vendor/dashboard/payouts"}]'::jsonb),

-- Refund Deduction Notice
('refund_deduction', 'Refund Deduction Notice', 'Sent when a refund is deducted from vendor balance', 'payout',
'Refund Deduction Notice - Order {{orderName}}',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f9fafb; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 32px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="font-size: 48px; margin-bottom: 16px;">↩️</div>
      <h1 style="color: #f59e0b; margin: 0 0 8px 0; font-size: 24px;">Refund Deduction Notice</h1>
      <p style="color: #6b7280; margin: 0; font-size: 14px;">Order {{orderName}}</p>
    </div>
    
    <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        Hi {{vendorName}}, a {{refundType}} refund has been processed for order {{orderName}}.
      </p>
    </div>
    
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <table style="width: 100%;">
        <tr>
          <td style="color: #6b7280; font-size: 14px; padding: 8px 0;">Order:</td>
          <td style="text-align: right; font-family: monospace;">{{orderName}}</td>
        </tr>
        <tr>
          <td style="color: #6b7280; font-size: 14px; padding: 8px 0;">Refund Type:</td>
          <td style="text-align: right; text-transform: capitalize;">{{refundType}}</td>
        </tr>
        <tr>
          <td style="color: #6b7280; font-size: 14px; padding: 8px 0;">Deduction Amount:</td>
          <td style="text-align: right; font-weight: 600; color: #ef4444;">-{{deductionAmount}}</td>
        </tr>
        <tr style="border-top: 1px solid #e5e7eb;">
          <td style="color: #374151; font-size: 14px; padding: 12px 0 0 0; font-weight: 600;">New Balance:</td>
          <td style="text-align: right; font-weight: 700; font-size: 16px; padding: 12px 0 0 0;">{{newBalance}}</td>
        </tr>
      </table>
    </div>
    
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 13px; color: #166534;">
        ℹ️ This amount has been automatically deducted from your available payout balance.
      </p>
    </div>
    
    <div style="text-align: center; margin-top: 32px;">
      <a href="{{payoutsUrl}}" style="display: inline-block; background-color: #8217ff; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">
        View Payout Details
      </a>
    </div>
    
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">
        Questions about this deduction? Contact support for assistance.
      </p>
    </div>
  </div>
</body>
</html>',
'[{"name": "vendorName", "description": "Vendor business name", "example": "Acme Art Co"}, {"name": "orderName", "description": "Order number", "example": "#1234"}, {"name": "refundType", "description": "Type of refund (full/partial)", "example": "partial"}, {"name": "deductionAmount", "description": "Amount deducted with currency", "example": "$50.00"}, {"name": "newBalance", "description": "New balance after deduction", "example": "$1,184.56"}, {"name": "payoutsUrl", "description": "URL to payouts dashboard", "example": "https://app.thestreetcollector.com/vendor/dashboard/payouts"}]'::jsonb),

-- Collector Welcome
('collector_welcome', 'Collector Welcome', 'Sent when a new collector signs up', 'welcome',
'Welcome to Street Collector!',
'<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f9fafb; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 32px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="font-size: 48px; margin-bottom: 16px;">🎨</div>
      <h1 style="color: #8217ff; margin: 0 0 8px 0; font-size: 28px;">Welcome to Street Collector!</h1>
      <p style="color: #6b7280; margin: 0; font-size: 16px;">Your art collecting journey begins here</p>
    </div>
    
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #374151;">
        Hi {{customerName}}, welcome to the Street Collector community! You now have access to:
      </p>
      <ul style="margin: 0; padding: 0 0 0 20px; color: #6b7280; font-size: 14px;">
        <li style="margin-bottom: 8px;">Your personal art collection dashboard</li>
        <li style="margin-bottom: 8px;">Exclusive artist content and stories</li>
        <li style="margin-bottom: 8px;">Limited edition certificates of authenticity</li>
        <li>Real-time order tracking</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin-top: 32px;">
      <a href="{{dashboardUrl}}" style="display: inline-block; background-color: #8217ff; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 14px;">
        View Your Collection
      </a>
    </div>
    
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">
        Questions? We''re here to help - just reply to this email.
      </p>
    </div>
  </div>
</body>
</html>',
'[{"name": "customerName", "description": "Customer''s first name", "example": "John"}, {"name": "dashboardUrl", "description": "URL to collector dashboard", "example": "https://app.thestreetcollector.com/collector/dashboard"}]'::jsonb)

ON CONFLICT (template_key) DO NOTHING;
