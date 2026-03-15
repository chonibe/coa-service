-- Allow recording quiz responses (name, owns_lamp, purpose) even when email is not yet collected.
-- Email can be added later (e.g. at checkout or login); link/lookup still works when email is set.

ALTER TABLE public.experience_quiz_signups
  ALTER COLUMN email DROP NOT NULL;

COMMENT ON COLUMN public.experience_quiz_signups.email IS 'Optional; set when user provides email (quiz step, checkout, or login).';
