-- Add affiliate_commission to collector_transaction_type enum
-- Used when an artist earns 10% commission on lamp sales from their referral link

DO $$
DECLARE
  v_enum_oid OID;
BEGIN
  SELECT oid INTO v_enum_oid FROM pg_type WHERE typname = 'collector_transaction_type';

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'affiliate_commission'
    AND enumtypid = v_enum_oid
  ) THEN
    ALTER TYPE collector_transaction_type ADD VALUE 'affiliate_commission';
  END IF;
END $$;

COMMENT ON TYPE collector_transaction_type IS 'Ledger transaction types. affiliate_commission: 10% earned by artist on lamp sales from their referral link.';
