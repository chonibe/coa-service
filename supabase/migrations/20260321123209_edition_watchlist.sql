-- Edition watchlist: collectors save artwork + stage; stage-change emails; conversion dedupe

CREATE TABLE public.edition_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  shopify_product_id TEXT NOT NULL,
  stage_at_save TEXT NOT NULL,
  product_title TEXT,
  product_handle TEXT,
  artist_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, shopify_product_id)
);

CREATE TABLE public.edition_watchlist_stage_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_id UUID NOT NULL REFERENCES public.edition_watchlist (id) ON DELETE CASCADE,
  stage_key TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (watchlist_id, stage_key)
);

CREATE TABLE public.edition_product_edition_stage_state (
  shopify_product_id TEXT PRIMARY KEY,
  stage_key TEXT NOT NULL,
  edition_sold INTEGER NOT NULL DEFAULT 0,
  total_editions INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.edition_watchlist_conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL,
  watchlist_id UUID NOT NULL REFERENCES public.edition_watchlist (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (order_id, watchlist_id)
);

CREATE INDEX idx_edition_watchlist_user ON public.edition_watchlist (user_id);
CREATE INDEX idx_edition_watchlist_product ON public.edition_watchlist (shopify_product_id);

ALTER TABLE public.edition_watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY edition_watchlist_select_own
  ON public.edition_watchlist FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY edition_watchlist_insert_own
  ON public.edition_watchlist FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY edition_watchlist_update_own
  ON public.edition_watchlist FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY edition_watchlist_delete_own
  ON public.edition_watchlist FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

ALTER TABLE public.edition_watchlist_stage_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edition_product_edition_stage_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edition_watchlist_conversion_events ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.edition_watchlist IS 'Collector edition watchlist; one row per user+Shopify product';
COMMENT ON TABLE public.edition_watchlist_stage_notifications IS 'Dedupe: at most one stage notification email per watchlist row per stage';
COMMENT ON TABLE public.edition_product_edition_stage_state IS 'Last known edition stage per product for webhook transition detection';;
