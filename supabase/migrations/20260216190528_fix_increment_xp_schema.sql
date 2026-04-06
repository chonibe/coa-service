
-- Fix increment_xp to use explicit public schema
CREATE OR REPLACE FUNCTION increment_xp(p_player_id uuid, p_xp bigint)
RETURNS void AS $$
DECLARE
  current_xp bigint;
  current_level int;
  new_xp bigint;
  new_level int;
  xp_threshold bigint;
BEGIN
  SELECT xp, level INTO current_xp, current_level
  FROM public.casino_players WHERE id = p_player_id;

  IF NOT FOUND THEN RETURN; END IF;

  new_xp := current_xp + p_xp;
  new_level := current_level;

  LOOP
    xp_threshold := new_level * 100;
    EXIT WHEN new_xp < xp_threshold OR new_level >= 100;
    new_xp := new_xp - xp_threshold;
    new_level := new_level + 1;
  END LOOP;

  UPDATE public.casino_players
  SET xp = new_xp, level = new_level
  WHERE id = p_player_id;

  UPDATE public.casino_players SET vip_tier =
    CASE
      WHEN new_level >= 76 THEN 'diamond'::public.casino_vip_tier
      WHEN new_level >= 51 THEN 'platinum'::public.casino_vip_tier
      WHEN new_level >= 26 THEN 'gold'::public.casino_vip_tier
      WHEN new_level >= 11 THEN 'silver'::public.casino_vip_tier
      ELSE 'bronze'::public.casino_vip_tier
    END
  WHERE id = p_player_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
;
