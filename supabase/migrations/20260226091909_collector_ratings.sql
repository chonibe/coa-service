-- Collector ratings table for crew-based taste clustering
-- Persists artwork ratings (1-5) for authenticated collectors
-- Date: 2026-02-26

CREATE TABLE IF NOT EXISTS public.collector_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collector_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (collector_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_collector_ratings_collector_id ON public.collector_ratings(collector_id);
CREATE INDEX IF NOT EXISTS idx_collector_ratings_product_id ON public.collector_ratings(product_id);

ALTER TABLE public.collector_ratings ENABLE ROW LEVEL SECURITY;

-- Collectors can SELECT their own ratings
CREATE POLICY "Collectors can view their own ratings"
  ON public.collector_ratings
  FOR SELECT
  USING (collector_id = auth.uid());

-- Collectors can INSERT their own ratings
CREATE POLICY "Collectors can insert their own ratings"
  ON public.collector_ratings
  FOR INSERT
  WITH CHECK (collector_id = auth.uid());

-- Collectors can UPDATE their own ratings
CREATE POLICY "Collectors can update their own ratings"
  ON public.collector_ratings
  FOR UPDATE
  USING (collector_id = auth.uid());

-- Admins can manage all ratings (for debugging/support)
CREATE POLICY "Admins can manage all ratings"
  ON public.collector_ratings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_collector_ratings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_collector_ratings_updated_at ON public.collector_ratings;
CREATE TRIGGER trg_update_collector_ratings_updated_at
  BEFORE UPDATE ON public.collector_ratings
  FOR EACH ROW EXECUTE FUNCTION update_collector_ratings_updated_at();

COMMENT ON TABLE public.collector_ratings IS 'Artwork ratings (1-5) from authenticated collectors for crew-based taste clustering.';;
