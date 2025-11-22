-- Create payout_schedules table for automated payout scheduling
CREATE TABLE IF NOT EXISTS payout_schedules (
  id SERIAL PRIMARY KEY,
  vendor_name TEXT NOT NULL REFERENCES vendors(vendor_name) ON DELETE CASCADE,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('weekly', 'monthly', 'manual')),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 28), -- 1-28 to avoid month-end issues
  enabled BOOLEAN DEFAULT TRUE,
  minimum_amount NUMERIC(10,2) DEFAULT 0, -- Minimum payout amount to trigger
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(vendor_name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payout_schedules_enabled ON payout_schedules(enabled) WHERE enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_payout_schedules_next_run ON payout_schedules(next_run) WHERE enabled = TRUE;

-- Add email notification preferences for refund deductions (table already exists from previous migration)
ALTER TABLE vendor_notification_preferences
ADD COLUMN IF NOT EXISTS refund_deduction BOOLEAN DEFAULT TRUE;

-- Add payout_failed and payout_pending columns if they don't exist
ALTER TABLE vendor_notification_preferences
ADD COLUMN IF NOT EXISTS payout_failed BOOLEAN DEFAULT TRUE;

ALTER TABLE vendor_notification_preferences
ADD COLUMN IF NOT EXISTS payout_pending BOOLEAN DEFAULT TRUE;

-- Create email_log table to track sent emails
CREATE TABLE IF NOT EXISTS email_log (
  id SERIAL PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  email_type TEXT NOT NULL, -- 'payout_processed', 'payout_failed', 'payout_pending', 'refund_deduction', 'invoice'
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  message_id TEXT, -- Email service message ID
  error_message TEXT,
  metadata JSONB, -- Additional data (payout_id, vendor_name, etc.)
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for email_log
CREATE INDEX IF NOT EXISTS idx_email_log_recipient ON email_log(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_log_type ON email_log(email_type);
CREATE INDEX IF NOT EXISTS idx_email_log_status ON email_log(status);
CREATE INDEX IF NOT EXISTS idx_email_log_sent_at ON email_log(sent_at DESC);

-- Function to calculate next run time for a schedule
CREATE OR REPLACE FUNCTION calculate_next_payout_run(
  p_schedule_type TEXT,
  p_day_of_week INTEGER DEFAULT NULL,
  p_day_of_month INTEGER DEFAULT NULL
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  next_date DATE;
  current_date DATE := CURRENT_DATE;
BEGIN
  IF p_schedule_type = 'weekly' AND p_day_of_week IS NOT NULL THEN
    -- Calculate next occurrence of day_of_week
    next_date := current_date + ((p_day_of_week - EXTRACT(DOW FROM current_date) + 7) % 7)::INTEGER;
    -- If today is the scheduled day and it's past 9 AM, schedule for next week
    IF next_date = current_date AND CURRENT_TIME < '09:00:00' THEN
      -- Schedule for today at 9 AM
      RETURN (next_date || ' 09:00:00')::TIMESTAMP WITH TIME ZONE;
    ELSE
      -- Schedule for next week
      next_date := next_date + 7;
      RETURN (next_date || ' 09:00:00')::TIMESTAMP WITH TIME ZONE;
    END IF;
  ELSIF p_schedule_type = 'monthly' AND p_day_of_month IS NOT NULL THEN
    -- Calculate next occurrence of day_of_month
    next_date := DATE_TRUNC('month', current_date) + (p_day_of_month - 1) * INTERVAL '1 day';
    -- If this month's date has passed, move to next month
    IF next_date < current_date THEN
      next_date := DATE_TRUNC('month', current_date) + INTERVAL '1 month' + (p_day_of_month - 1) * INTERVAL '1 day';
    END IF;
    RETURN (next_date || ' 09:00:00')::TIMESTAMP WITH TIME ZONE;
  ELSE
    -- Manual schedule, return NULL
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update next_run for all enabled schedules
CREATE OR REPLACE FUNCTION update_payout_schedule_next_runs()
RETURNS void AS $$
BEGIN
  UPDATE payout_schedules
  SET next_run = calculate_next_payout_run(schedule_type, day_of_week, day_of_month)
  WHERE enabled = TRUE
    AND schedule_type != 'manual';
END;
$$ LANGUAGE plpgsql;

