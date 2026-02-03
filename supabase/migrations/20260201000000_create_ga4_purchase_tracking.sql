-- Create GA4 purchase tracking table for client-side tracking
-- This stores purchase data that will be retrieved by the client for GA4 e-commerce tracking

CREATE TABLE IF NOT EXISTS ga4_purchase_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id TEXT NOT NULL UNIQUE,
    purchase_data JSONB NOT NULL,
    tracked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_ga4_purchase_tracking_order_id ON ga4_purchase_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_ga4_purchase_tracking_tracked_at ON ga4_purchase_tracking(tracked_at) WHERE tracked_at IS NULL;

-- Add RLS policies
ALTER TABLE ga4_purchase_tracking ENABLE ROW LEVEL SECURITY;

-- Allow service role to insert/update (webhook)
CREATE POLICY "Service role can manage purchase tracking" ON ga4_purchase_tracking
    FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to read their own purchase data (for client-side tracking)
CREATE POLICY "Users can read purchase tracking for client-side GA4" ON ga4_purchase_tracking
    FOR SELECT USING (auth.role() = 'authenticated');

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ga4_purchase_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on changes
CREATE TRIGGER trigger_update_ga4_purchase_tracking_updated_at
    BEFORE UPDATE ON ga4_purchase_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_ga4_purchase_tracking_updated_at();