-- Add bi-weekly schedule type support
-- This migration adds biweekly schedule type and biweekly_interval field

-- Update schedule_type CHECK constraint to include 'biweekly'
ALTER TABLE payout_schedules
DROP CONSTRAINT IF EXISTS payout_schedules_schedule_type_check;

ALTER TABLE payout_schedules
ADD CONSTRAINT payout_schedules_schedule_type_check 
CHECK (schedule_type IN ('weekly', 'monthly', 'biweekly', 'manual'));

-- Add biweekly_interval field (1st/15th or custom day)
ALTER TABLE payout_schedules
ADD COLUMN IF NOT EXISTS biweekly_interval INTEGER CHECK (biweekly_interval >= 1 AND biweekly_interval <= 28);

-- Update calculate_next_payout_run function to support bi-weekly
CREATE OR REPLACE FUNCTION calculate_next_payout_run(
  p_schedule_type TEXT,
  p_day_of_week INTEGER DEFAULT NULL,
  p_day_of_month INTEGER DEFAULT NULL,
  p_biweekly_interval INTEGER DEFAULT NULL
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  next_date DATE;
  current_date DATE := CURRENT_DATE;
  current_day INTEGER;
BEGIN
  IF p_schedule_type = 'weekly' AND p_day_of_week IS NOT NULL THEN
    -- Calculate next occurrence of day_of_week
    next_date := current_date + ((p_day_of_week - EXTRACT(DOW FROM current_date) + 7) % 7)::INTEGER;
    -- If today is the scheduled day and it's past 9 AM, schedule for next week
    IF next_date = current_date AND CURRENT_TIME < '09:00:00' THEN
      -- Schedule for today at 9 AM
      RETURN (next_date || ' 09:00:00')::TIMESTAMP WITH TIME ZONE;
    ELSE
      -- Schedule for next week
      next_date := next_date + 7;
      RETURN (next_date || ' 09:00:00')::TIMESTAMP WITH TIME ZONE;
    END IF;
  ELSIF p_schedule_type = 'monthly' AND p_day_of_month IS NOT NULL THEN
    -- Calculate next occurrence of day_of_month
    next_date := DATE_TRUNC('month', current_date) + (p_day_of_month - 1) * INTERVAL '1 day';
    -- If this month's date has passed, move to next month
    IF next_date < current_date THEN
      next_date := DATE_TRUNC('month', current_date) + INTERVAL '1 month' + (p_day_of_month - 1) * INTERVAL '1 day';
    END IF;
    RETURN (next_date || ' 09:00:00')::TIMESTAMP WITH TIME ZONE;
  ELSIF p_schedule_type = 'biweekly' AND p_biweekly_interval IS NOT NULL THEN
    -- Bi-weekly: pay on 1st and 15th of each month (or custom interval days)
    current_day := EXTRACT(DAY FROM current_date)::INTEGER;
    
    -- Determine which bi-weekly period we're in
    IF current_day < p_biweekly_interval THEN
      -- Before first interval, schedule for first interval
      next_date := DATE_TRUNC('month', current_date) + (p_biweekly_interval - 1) * INTERVAL '1 day';
    ELSIF current_day < 15 THEN
      -- Between first interval and 15th, schedule for 15th
      next_date := DATE_TRUNC('month', current_date) + 14 * INTERVAL '1 day';
    ELSE
      -- After 15th, schedule for first interval of next month
      next_date := DATE_TRUNC('month', current_date) + INTERVAL '1 month' + (p_biweekly_interval - 1) * INTERVAL '1 day';
    END IF;
    
    -- If the calculated date is today and it's past 9 AM, move to next period
    IF next_date = current_date AND CURRENT_TIME >= '09:00:00' THEN
      IF current_day < 15 THEN
        -- Move to 15th
        next_date := DATE_TRUNC('month', current_date) + 14 * INTERVAL '1 day';
      ELSE
        -- Move to first interval of next month
        next_date := DATE_TRUNC('month', current_date) + INTERVAL '1 month' + (p_biweekly_interval - 1) * INTERVAL '1 day';
      END IF;
    END IF;
    
    RETURN (next_date || ' 09:00:00')::TIMESTAMP WITH TIME ZONE;
  ELSE
    -- Manual schedule, return NULL
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Update update_payout_schedule_next_runs function to include biweekly_interval
CREATE OR REPLACE FUNCTION update_payout_schedule_next_runs()
RETURNS void AS $$
BEGIN
  UPDATE payout_schedules
  SET next_run = calculate_next_payout_run(schedule_type, day_of_week, day_of_month, biweekly_interval)
  WHERE enabled = TRUE
    AND schedule_type != 'manual';
END;
$$ LANGUAGE plpgsql;






