-- Experience quiz signups: store name/email from intro quiz for tracking and marketing
CREATE TABLE IF NOT EXISTS public.experience_quiz_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  owns_lamp BOOLEAN NOT NULL DEFAULT false,
  purpose TEXT NOT NULL CHECK (purpose IN ('self', 'gift')),
  source TEXT NOT NULL DEFAULT 'experience',
  affiliate_artist_slug TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_experience_quiz_signups_email ON public.experience_quiz_signups(email);
CREATE INDEX IF NOT EXISTS idx_experience_quiz_signups_created_at ON public.experience_quiz_signups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_experience_quiz_signups_affiliate ON public.experience_quiz_signups(affiliate_artist_slug) WHERE affiliate_artist_slug IS NOT NULL;

ALTER TABLE public.experience_quiz_signups ENABLE ROW LEVEL SECURITY;

-- Service role used by API bypasses RLS; allow admins to read for marketing/export
CREATE POLICY "Admins can view experience quiz signups"
  ON public.experience_quiz_signups FOR SELECT
  USING (public.has_role('admin'));
