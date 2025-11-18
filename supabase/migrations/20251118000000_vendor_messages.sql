-- Create vendor_messages table for vendor-customer/admin communication
CREATE TABLE IF NOT EXISTS vendor_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_name TEXT NOT NULL,
  thread_id UUID NOT NULL, -- Groups related messages together
  sender_type TEXT NOT NULL CHECK (sender_type IN ('vendor', 'customer', 'admin', 'system')),
  sender_id TEXT, -- Can be customer_id, admin_email, or vendor_name
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('vendor', 'customer', 'admin', 'system')),
  recipient_id TEXT,
  subject TEXT,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vendor_notifications table for system notifications
CREATE TABLE IF NOT EXISTS vendor_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('new_order', 'payout_processed', 'product_status_change', 'system_announcement', 'message_received')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT, -- Optional link to related page
  metadata JSONB, -- Additional data (order_id, payout_amount, etc.)
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vendor_notification_preferences table
CREATE TABLE IF NOT EXISTS vendor_notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_name TEXT NOT NULL UNIQUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT FALSE,
  new_order BOOLEAN DEFAULT TRUE,
  payout_processed BOOLEAN DEFAULT TRUE,
  product_status_change BOOLEAN DEFAULT TRUE,
  system_announcement BOOLEAN DEFAULT TRUE,
  message_received BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendor_messages_vendor_name ON vendor_messages(vendor_name);
CREATE INDEX IF NOT EXISTS idx_vendor_messages_thread_id ON vendor_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_vendor_messages_created_at ON vendor_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_messages_is_read ON vendor_messages(is_read);

CREATE INDEX IF NOT EXISTS idx_vendor_notifications_vendor_name ON vendor_notifications(vendor_name);
CREATE INDEX IF NOT EXISTS idx_vendor_notifications_type ON vendor_notifications(type);
CREATE INDEX IF NOT EXISTS idx_vendor_notifications_is_read ON vendor_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_vendor_notifications_created_at ON vendor_notifications(created_at DESC);

-- Enable RLS
ALTER TABLE vendor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendor_messages
-- Vendors can only see their own messages
CREATE POLICY "Vendors can view their own messages"
  ON vendor_messages FOR SELECT
  USING (
    vendor_name IN (
      SELECT vendor_name FROM vendor_users WHERE auth_id = auth.uid()
    )
  );

-- Vendors can insert messages to their threads
CREATE POLICY "Vendors can create messages"
  ON vendor_messages FOR INSERT
  WITH CHECK (
    vendor_name IN (
      SELECT vendor_name FROM vendor_users WHERE auth_id = auth.uid()
    )
  );

-- Vendors can update their own messages (mark as read)
CREATE POLICY "Vendors can update their messages"
  ON vendor_messages FOR UPDATE
  USING (
    vendor_name IN (
      SELECT vendor_name FROM vendor_users WHERE auth_id = auth.uid()
    )
  );

-- RLS Policies for vendor_notifications
-- Vendors can only see their own notifications
CREATE POLICY "Vendors can view their own notifications"
  ON vendor_notifications FOR SELECT
  USING (
    vendor_name IN (
      SELECT vendor_name FROM vendor_users WHERE auth_id = auth.uid()
    )
  );

-- Vendors can update their own notifications (mark as read)
CREATE POLICY "Vendors can update their notifications"
  ON vendor_notifications FOR UPDATE
  USING (
    vendor_name IN (
      SELECT vendor_name FROM vendor_users WHERE auth_id = auth.uid()
    )
  );

-- RLS Policies for vendor_notification_preferences
-- Vendors can view and update their own preferences
CREATE POLICY "Vendors can manage their notification preferences"
  ON vendor_notification_preferences FOR ALL
  USING (
    vendor_name IN (
      SELECT vendor_name FROM vendor_users WHERE auth_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_vendor_messages_updated_at
  BEFORE UPDATE ON vendor_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_notification_preferences_updated_at
  BEFORE UPDATE ON vendor_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

