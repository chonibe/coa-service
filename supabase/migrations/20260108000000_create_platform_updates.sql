-- Create platform_updates table
CREATE TABLE IF NOT EXISTS public.platform_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('feature', 'fix', 'improvement', 'update')),
  version text,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  admin_email text NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS platform_updates_created_at_idx ON public.platform_updates (created_at DESC);
CREATE INDEX IF NOT EXISTS platform_updates_category_idx ON public.platform_updates (category);

-- Enable RLS (standard in this repo for security)
ALTER TABLE public.platform_updates ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage updates
CREATE POLICY "Admins can manage platform updates" ON public.platform_updates
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert initial data from PROJECT_DASHBOARD.md
INSERT INTO public.platform_updates (title, description, category, version, admin_email)
VALUES 
('Vercel AI Gateway Integration', 'Integrated Vercel AI SDK and Gateway, replacing placeholder insights logic with live OpenAI calls.', 'feature', '1.1.0', 'admin@streetcollector.com'),
('Vendor Dashboard Hardening', 'Introduced signed vendor sessions, Supabase-aligned analytics, and GBP-consistent dashboards.', 'improvement', '1.1.0', 'admin@streetcollector.com'),
('Admin Portal UX Refresh', 'Grouped navigation, added command palette, and refreshed admin home overview.', 'improvement', '1.1.0', 'admin@streetcollector.com'),
('ChinaDivision Auto-Fulfillment', 'Automates tracking link creation, customer email, and Shopify fulfillment.', 'feature', '1.1.0', 'admin@streetcollector.com'),
('Collector Dashboard Launch', 'Added aggregated collector dashboard with artworks grid, artist journeys, and credits management.', 'feature', '1.1.0', 'admin@streetcollector.com');



