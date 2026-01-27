-- First Edition Reserve System Migration
-- Creates tables and columns to track automatic first edition purchases for choni@thestreetlamp.com
-- Date: 2026-01-26

-- ============================================
-- PART 1: First Edition Reserves Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.first_edition_reserves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  vendor_name text NOT NULL,
  order_id text NOT NULL,
  line_item_id text NOT NULL,
  reserved_at timestamptz DEFAULT now(),
  reserved_by text DEFAULT 'choni@thestreetlamp.com',
  purchase_price decimal(10,2) NOT NULL,
  payout_amount decimal(10,2) NOT NULL,
  status text CHECK (status IN ('reserved', 'fulfilled', 'cancelled')) DEFAULT 'fulfilled',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_first_edition_reserves_product_id ON public.first_edition_reserves(product_id);
CREATE INDEX IF NOT EXISTS idx_first_edition_reserves_status ON public.first_edition_reserves(status);
CREATE INDEX IF NOT EXISTS idx_first_edition_reserves_order_id ON public.first_edition_reserves(order_id);
CREATE INDEX IF NOT EXISTS idx_first_edition_reserves_vendor_name ON public.first_edition_reserves(vendor_name);

-- ============================================
-- PART 2: Products Table Extensions
-- ============================================

ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS first_edition_reserved boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS first_edition_order_id text;

CREATE INDEX IF NOT EXISTS idx_products_first_edition_reserved ON public.products(first_edition_reserved);

-- ============================================
-- PART 3: RLS Policies
-- ============================================

ALTER TABLE public.first_edition_reserves ENABLE ROW LEVEL SECURITY;

-- Admins can manage all first edition reserves
DROP POLICY IF EXISTS "Admins can manage first edition reserves" ON public.first_edition_reserves;
CREATE POLICY "Admins can manage first edition reserves"
  ON public.first_edition_reserves FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
        AND ur.is_active = true
    )
  );

-- Collectors can view their own reserves
DROP POLICY IF EXISTS "Collectors can view their own reserves" ON public.first_edition_reserves;
CREATE POLICY "Collectors can view their own reserves"
  ON public.first_edition_reserves FOR SELECT
  USING (
    reserved_by = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- ============================================
-- PART 4: Update Trigger for updated_at
-- ============================================

CREATE OR REPLACE FUNCTION public.update_first_edition_reserves_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_first_edition_reserves_updated_at ON public.first_edition_reserves;
CREATE TRIGGER trigger_update_first_edition_reserves_updated_at
  BEFORE UPDATE ON public.first_edition_reserves
  FOR EACH ROW
  EXECUTE FUNCTION public.update_first_edition_reserves_updated_at();

-- ============================================
-- Success Message
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '================================';
  RAISE NOTICE 'First Edition Reserve System Schema Created!';
  RAISE NOTICE '================================';
  RAISE NOTICE 'Tables created: first_edition_reserves';
  RAISE NOTICE 'Columns added to products: first_edition_reserved, first_edition_order_id';
  RAISE NOTICE 'RLS policies enabled';
  RAISE NOTICE '================================';
END $$;
