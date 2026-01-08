-- Migration: Log Edition Events Trigger
-- Automatically logs events to edition_events table when changes occur in order_line_items_v2

CREATE OR REPLACE FUNCTION log_edition_event()
RETURNS TRIGGER AS $$
DECLARE
    event_type_value TEXT;
    event_data_value JSONB;
BEGIN
    -- Determine event type based on what changed
    event_type_value := NULL;
    event_data_value := '{}'::jsonb;

    -- Check if edition_number was assigned (NEW has it, OLD doesn't or is different)
    -- Handle INSERT case (OLD is NULL) and UPDATE case (OLD exists)
    IF NEW.edition_number IS NOT NULL AND 
       (OLD IS NULL OR OLD.edition_number IS NULL OR OLD.edition_number IS DISTINCT FROM NEW.edition_number) THEN
        event_type_value := 'edition_assigned';
        event_data_value := jsonb_build_object(
            'edition_number', NEW.edition_number,
            'edition_total', NEW.edition_total,
            'previous_edition_number', CASE WHEN OLD IS NULL THEN NULL ELSE OLD.edition_number END
        );
    END IF;

    -- Check if NFC was authenticated (NEW has nfc_claimed_at, OLD doesn't)
    IF NEW.nfc_claimed_at IS NOT NULL AND (OLD IS NULL OR OLD.nfc_claimed_at IS NULL) THEN
        event_type_value := 'nfc_authenticated';
        event_data_value := jsonb_build_object(
            'nfc_tag_id', NEW.nfc_tag_id,
            'nfc_claimed_at', NEW.nfc_claimed_at,
            'edition_number', NEW.edition_number
        );
    END IF;

    -- Check if ownership changed (only on UPDATE, not INSERT)
    IF OLD IS NOT NULL AND 
       ((OLD.owner_name IS DISTINCT FROM NEW.owner_name) OR 
        (OLD.owner_email IS DISTINCT FROM NEW.owner_email) OR
        (OLD.owner_id IS DISTINCT FROM NEW.owner_id)) THEN
        event_type_value := 'ownership_transfer';
        event_data_value := jsonb_build_object(
            'from_owner_name', OLD.owner_name,
            'from_owner_email', OLD.owner_email,
            'from_owner_id', OLD.owner_id,
            'to_owner_name', NEW.owner_name,
            'to_owner_email', NEW.owner_email,
            'to_owner_id', NEW.owner_id
        );
    END IF;

    -- Check if status changed (only on UPDATE, not INSERT)
    IF OLD IS NOT NULL AND OLD.status IS DISTINCT FROM NEW.status THEN
        event_type_value := 'status_changed';
        event_data_value := jsonb_build_object(
            'from_status', OLD.status,
            'to_status', NEW.status,
            'removed_reason', NEW.removed_reason
        );
    END IF;

    -- Check if certificate was generated
    IF NEW.certificate_url IS NOT NULL AND (OLD IS NULL OR OLD.certificate_url IS NULL) THEN
        event_type_value := 'certificate_generated';
        event_data_value := jsonb_build_object(
            'certificate_url', NEW.certificate_url,
            'certificate_token', NEW.certificate_token,
            'certificate_generated_at', NEW.certificate_generated_at
        );
    END IF;

    -- Only insert event if we detected a change
    IF event_type_value IS NOT NULL AND NEW.edition_number IS NOT NULL THEN
        INSERT INTO edition_events (
            line_item_id,
            product_id,
            edition_number,
            event_type,
            event_data,
            owner_name,
            owner_email,
            owner_id,
            fulfillment_status,
            status,
            created_by
        ) VALUES (
            NEW.line_item_id,
            NEW.product_id,
            NEW.edition_number,
            event_type_value,
            event_data_value,
            NEW.owner_name,
            NEW.owner_email,
            NEW.owner_id,
            NEW.fulfillment_status,
            NEW.status,
            current_setting('app.user_id', true) -- Can be set by application context
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on INSERT and UPDATE
DROP TRIGGER IF EXISTS trg_log_edition_events ON order_line_items_v2;
CREATE TRIGGER trg_log_edition_events
AFTER INSERT OR UPDATE ON order_line_items_v2
FOR EACH ROW
WHEN (NEW.edition_number IS NOT NULL)
EXECUTE FUNCTION log_edition_event();

-- Add comment
COMMENT ON FUNCTION log_edition_event() IS 'Automatically logs edition events to edition_events table when changes occur in order_line_items_v2.';
COMMENT ON TRIGGER trg_log_edition_events ON order_line_items_v2 IS 'Triggers event logging when edition-related fields change in order_line_items_v2.';

