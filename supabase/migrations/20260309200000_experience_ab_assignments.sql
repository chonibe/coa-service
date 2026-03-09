-- A/B test: experience onboarding vs skip. Half of visitors get onboarding, half skip to configurator.
-- Assignments are recorded here for analysis; variant is also stored in cookie and GA4 user property.

CREATE TABLE IF NOT EXISTS public.experience_ab_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant TEXT NOT NULL CHECK (variant IN ('onboarding', 'skip')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_experience_ab_assignments_created_at
  ON public.experience_ab_assignments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_experience_ab_assignments_variant
  ON public.experience_ab_assignments(variant);

ALTER TABLE public.experience_ab_assignments ENABLE ROW LEVEL SECURITY;

-- Allow anonymous insert (assignment is recorded from client; no auth required)
CREATE POLICY "Allow insert for experience ab assignments"
  ON public.experience_ab_assignments FOR INSERT
  WITH CHECK (true);

-- Admins can read for reporting
CREATE POLICY "Admins can view experience ab assignments"
  ON public.experience_ab_assignments FOR SELECT
  USING (public.has_role('admin'));
