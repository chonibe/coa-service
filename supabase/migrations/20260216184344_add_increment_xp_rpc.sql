
-- RPC function to increment player XP and handle level-ups
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
  FROM casino_players WHERE id = p_player_id;
  
  IF NOT FOUND THEN RETURN; END IF;
  
  new_xp := current_xp + p_xp;
  new_level := current_level;
  
  -- Level up formula: each level requires level * 100 XP
  LOOP
    xp_threshold := new_level * 100;
    EXIT WHEN new_xp < xp_threshold OR new_level >= 100;
    new_xp := new_xp - xp_threshold;
    new_level := new_level + 1;
  END LOOP;
  
  UPDATE casino_players 
  SET xp = new_xp, level = new_level 
  WHERE id = p_player_id;
  
  -- Update VIP tier based on level
  UPDATE casino_players SET vip_tier = 
    CASE 
      WHEN new_level >= 76 THEN 'diamond'::casino_vip_tier
      WHEN new_level >= 51 THEN 'platinum'::casino_vip_tier
      WHEN new_level >= 26 THEN 'gold'::casino_vip_tier
      WHEN new_level >= 11 THEN 'silver'::casino_vip_tier
      ELSE 'bronze'::casino_vip_tier
    END
  WHERE id = p_player_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create player profile and wallet on signup
CREATE OR REPLACE FUNCTION handle_new_casino_player()
RETURNS trigger AS $$
BEGIN
  INSERT INTO casino_players (id, display_name) 
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'Player'))
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO casino_wallets (player_id, gc_balance, sc_balance) 
  VALUES (NEW.id, 10000000, 200)
  ON CONFLICT (player_id) DO NOTHING;
  
  INSERT INTO casino_transactions (player_id, type, currency, amount, balance_after, metadata) 
  VALUES (NEW.id, 'signup_bonus', 'gc', 10000000, 10000000, '{"reason":"welcome_bonus"}'::jsonb);
  
  INSERT INTO casino_transactions (player_id, type, currency, amount, balance_after, metadata) 
  VALUES (NEW.id, 'signup_bonus', 'sc', 200, 200, '{"reason":"welcome_bonus"}'::jsonb);
  
  INSERT INTO casino_notifications (player_id, type, title, body, icon, read) 
  VALUES (NEW.id, 'system', 'Welcome to CrownCoins!', 'You received GC 100,000 + SC 2.00 as a welcome bonus!', 'crown', false);
  
  INSERT INTO casino_responsible_gaming (player_id) 
  VALUES (NEW.id)
  ON CONFLICT (player_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created_casino ON auth.users;
CREATE TRIGGER on_auth_user_created_casino
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_casino_player();
;
