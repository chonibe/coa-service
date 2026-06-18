-- 24h soft edition holds when artworks are added to the experience cart (Phase: experience-v3)
-- Distinct from street_reserve_locks (paid Reserve membership price locks).

CREATE TABLE IF NOT EXISTS public.experience_cart_edition_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  holder_key text NOT NULL,
  shopify_product_id text NOT NULL,
  edition_number integer,
  locked_price_cents integer CHECK (locked_price_cents IS NULL OR locked_price_cents > 0),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (holder_key, shopify_product_id)
);

CREATE INDEX IF NOT EXISTS idx_experience_cart_edition_holds_expires
  ON public.experience_cart_edition_holds (expires_at);

CREATE INDEX IF NOT EXISTS idx_experience_cart_edition_holds_product_active
  ON public.experience_cart_edition_holds (shopify_product_id, expires_at);

ALTER TABLE public.experience_cart_edition_holds ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.experience_cart_edition_holds TO service_role;

COMMENT ON TABLE public.experience_cart_edition_holds IS
  'Soft 24h edition holds tied to cart lines in the shop experience flow. Managed via /api/shop/cart/edition-holds (service role).';
