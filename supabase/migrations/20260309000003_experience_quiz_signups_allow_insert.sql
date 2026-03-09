-- Allow browser (anon/authenticated) Supabase client to insert experience quiz signups
CREATE POLICY "Allow insert for experience quiz signups"
  ON public.experience_quiz_signups FOR INSERT
  WITH CHECK (true);
