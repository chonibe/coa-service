-- Create function to handle NFC tag pairing in a transaction
CREATE OR REPLACE FUNCTION pair_nfc_tag(
  p_serial_number TEXT,
  p_item_id UUID,
  p_user_id UUID
) RETURNS void AS $$
DECLARE
  v_tag_id UUID;
  v_certificate_id UUID;
BEGIN
  -- Check if the item is available for pairing
  IF NOT EXISTS (
    SELECT 1 FROM order_line_items_v2
    WHERE id = p_item_id
    AND nfc_pairing_status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Item is not available for pairing';
  END IF;

  -- Get or create NFC tag
  SELECT id INTO v_tag_id
  FROM nfc_tags
  WHERE serial_number = p_serial_number;

  IF v_tag_id IS NULL THEN
    -- Create new tag
    INSERT INTO nfc_tags (serial_number, created_by)
    VALUES (p_serial_number, p_user_id)
    RETURNING id INTO v_tag_id;
  ELSE
    -- Check if tag is already paired
    IF EXISTS (
      SELECT 1 FROM nfc_tags t
      JOIN order_line_items_v2 i ON i.nfc_tag_id = t.id
      WHERE t.id = v_tag_id
      AND i.nfc_pairing_status = 'paired'
    ) THEN
      RAISE EXCEPTION 'NFC tag is already paired';
    END IF;
  END IF;

  -- Get certificate ID for the item
  SELECT certificate_id INTO v_certificate_id
  FROM order_line_items_v2
  WHERE id = p_item_id;

  -- Update NFC tag with certificate
  UPDATE nfc_tags
  SET 
    certificate_id = v_certificate_id,
    updated_at = NOW(),
    updated_by = p_user_id
  WHERE id = v_tag_id;

  -- Update order line item
  UPDATE order_line_items_v2
  SET
    nfc_tag_id = v_tag_id,
    nfc_pairing_status = 'paired',
    nfc_paired_at = NOW(),
    nfc_paired_by = p_user_id
  WHERE id = p_item_id;

  -- Create audit log entry
  INSERT INTO audit_logs (
    action,
    table_name,
    record_id,
    user_id,
    changes
  ) VALUES (
    'pair_nfc_tag',
    'order_line_items_v2',
    p_item_id,
    p_user_id,
    jsonb_build_object(
      'nfc_tag_id', v_tag_id,
      'serial_number', p_serial_number,
      'paired_at', NOW()
    )
  );
END;
$$ LANGUAGE plpgsql; 