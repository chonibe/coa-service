-- Create system_logs table for comprehensive logging
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp BIGINT NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL')),
    message TEXT NOT NULL,
    context JSONB,
    source TEXT NOT NULL,
    trace_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create performance_metrics table for tracking system performance
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp BIGINT NOT NULL,
    operation TEXT NOT NULL,
    duration BIGINT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'FAILURE')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create error_tracking table for comprehensive error logging
CREATE TABLE error_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp BIGINT NOT NULL,
    error_type TEXT NOT NULL,
    message TEXT NOT NULL,
    stack_trace TEXT,
    context JSONB,
    severity TEXT NOT NULL CHECK (severity IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create webhook_destinations table for managing webhook integrations
CREATE TABLE webhook_destinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    secret TEXT NOT NULL,
    events TEXT[] NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create webhook_delivery_logs table for tracking webhook delivery attempts
CREATE TABLE webhook_delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination_id UUID REFERENCES webhook_destinations(id),
    event TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'RETRY_EXHAUSTED')),
    attempts INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    response_code INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX idx_system_logs_timestamp ON system_logs(timestamp);
CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_source ON system_logs(source);

CREATE INDEX idx_performance_metrics_timestamp ON performance_metrics(timestamp);
CREATE INDEX idx_performance_metrics_operation ON performance_metrics(operation);

CREATE INDEX idx_error_tracking_timestamp ON error_tracking(timestamp);
CREATE INDEX idx_error_tracking_severity ON error_tracking(severity);

CREATE INDEX idx_webhook_destinations_active ON webhook_destinations(active);
CREATE INDEX idx_webhook_delivery_logs_destination ON webhook_delivery_logs(destination_id);
CREATE INDEX idx_webhook_delivery_logs_status ON webhook_delivery_logs(status);

-- Add row-level security for sensitive tables
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_delivery_logs ENABLE ROW LEVEL SECURITY;

-- Create policies to restrict access
-- Policies commented out - admin_users table may not exist yet
-- Will be enabled once admin_users table is created

-- CREATE POLICY "Logs are viewable by admins only"
-- ON system_logs FOR SELECT
-- USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- CREATE POLICY "Performance metrics are viewable by admins only" 
-- ON performance_metrics FOR SELECT 
-- USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- CREATE POLICY "Error tracking is viewable by admins only" 
-- ON error_tracking FOR SELECT 
-- USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- CREATE POLICY "Webhook destinations are manageable by admins only" 
-- ON webhook_destinations FOR ALL 
-- USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- CREATE POLICY "Webhook delivery logs are viewable by admins only" 
-- ON webhook_delivery_logs FOR SELECT 
-- USING (auth.uid() IN (SELECT user_id FROM admin_users)); 