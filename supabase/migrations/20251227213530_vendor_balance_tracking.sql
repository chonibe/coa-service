-- Create vendor_balance_snapshots table for tracking balance history
CREATE TABLE IF NOT EXISTS vendor_balance_snapshots (
  id SERIAL PRIMARY KEY,
  vendor_name TEXT NOT NULL REFERENCES vendors(vendor_name) ON DELETE CASCADE,
  available_balance NUMERIC(10,2) NOT NULL DEFAULT 0,
  pending_balance NUMERIC(10,2) NOT NULL DEFAULT 0,
  held_balance NUMERIC(10,2) NOT NULL DEFAULT 0,
  snapshot_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for vendor_balance_snapshots
CREATE INDEX IF NOT EXISTS idx_vendor_balance_snapshots_vendor_date 
ON vendor_balance_snapshots(vendor_name, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_vendor_balance_snapshots_date 
ON vendor_balance_snapshots(snapshot_date DESC);

-- Function to create a balance snapshot for a vendor
CREATE OR REPLACE FUNCTION create_vendor_balance_snapshot(p_vendor_name TEXT)
RETURNS void AS $$
DECLARE
  v_available NUMERIC(10,2);
  v_pending NUMERIC(10,2);
  v_held NUMERIC(10,2);
BEGIN
  -- Calculate available balance (completed payouts - refunds)
  SELECT COALESCE(SUM(amount), 0) INTO v_available
  FROM vendor_ledger_entries
  WHERE vendor_name = p_vendor_name
    AND entry_type = 'payout'
    AND payout_id IN (
      SELECT id FROM vendor_payouts 
      WHERE vendor_name = p_vendor_name 
      AND status = 'completed'
    );

  -- Calculate pending balance (fulfilled items not yet paid)
  SELECT COALESCE(SUM(
    CASE 
      WHEN pvp.is_percentage THEN (oli.price * pvp.payout_amount / 100)
      ELSE pvp.payout_amount
    END
  ), 0) INTO v_pending
  FROM order_line_items_v2 oli
  LEFT JOIN product_vendor_payouts pvp ON oli.product_id::TEXT = pvp.product_id::TEXT 
    AND oli.vendor_name = pvp.vendor_name
  WHERE oli.vendor_name = p_vendor_name
    AND oli.fulfillment_status = 'fulfilled'
    AND oli.line_item_id NOT IN (
      SELECT line_item_id FROM vendor_payout_items WHERE payout_id IS NOT NULL
    )
    AND (oli.refund_status IS NULL OR oli.refund_status = 'none');

  -- Calculate held balance (refund deductions)
  SELECT COALESCE(SUM(ABS(amount)), 0) INTO v_held
  FROM vendor_ledger_entries
  WHERE vendor_name = p_vendor_name
    AND entry_type = 'refund_deduction';

  -- Insert snapshot
  INSERT INTO vendor_balance_snapshots (
    vendor_name,
    available_balance,
    pending_balance,
    held_balance,
    snapshot_date
  ) VALUES (
    p_vendor_name,
    v_available,
    v_pending,
    v_held,
    NOW()
  );
END;
$$ LANGUAGE plpgsql;








