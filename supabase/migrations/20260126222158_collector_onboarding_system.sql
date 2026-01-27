-- Migration: Collector Onboarding System
-- Creates tables for onboarding analytics (admin visibility) and achievements
-- Adds onboarding tracking columns to collector_profiles

-- ============================================
-- PART 1: Onboarding Analytics Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.collector_onboarding_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collector_email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  time_spent_seconds INTEGER,
  entered_at TIMESTAMPTZ DEFAULT NOW(),
  exited_at TIMESTAMPTZ,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_email ON public.collector_onboarding_analytics(collector_email);
CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_user_id ON public.collector_onboarding_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_created_at ON public.collector_onboarding_analytics(created_at DESC);

-- ============================================
-- PART 2: Add Onboarding Tracking to Profiles
-- ============================================

ALTER TABLE public.collector_profiles 
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS signup_source TEXT DEFAULT 'oauth';

-- ============================================
-- PART 3: Achievements Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.collector_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collector_email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_title TEXT NOT NULL,
  achievement_description TEXT,
  achieved_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_achievements_email ON public.collector_achievements(collector_email);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON public.collector_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_type ON public.collector_achievements(achievement_type);

-- ============================================
-- PART 4: Add Signup Bonus Transaction Type
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'signup_bonus' AND enumtypid = 'collector_transaction_type'::regtype) THEN
    ALTER TYPE collector_transaction_type ADD VALUE 'signup_bonus';
  END IF;
END $$;

-- ============================================
-- PART 5: RLS Policies
-- ============================================

ALTER TABLE public.collector_onboarding_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collector_achievements ENABLE ROW LEVEL SECURITY;

-- Admins can view all onboarding analytics
DROP POLICY IF EXISTS "Admins can view onboarding analytics" ON public.collector_onboarding_analytics;
CREATE POLICY "Admins can view onboarding analytics"
  ON public.collector_onboarding_analytics FOR SELECT
  USING (public.has_role('admin'));

-- Collectors can view their own achievements
DROP POLICY IF EXISTS "Collectors view own achievements" ON public.collector_achievements;
CREATE POLICY "Collectors view own achievements"
  ON public.collector_achievements FOR SELECT
  USING (public.has_role('collector') AND user_id = auth.uid());

-- Admins can view all achievements
DROP POLICY IF EXISTS "Admins can view all achievements" ON public.collector_achievements;
CREATE POLICY "Admins can view all achievements"
  ON public.collector_achievements FOR SELECT
  USING (public.has_role('admin'));
