
-- Fix trigger function to use explicit public schema references
CREATE OR REPLACE FUNCTION handle_new_casino_player()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.casino_players (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'Player'))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.casino_wallets (player_id, gc_balance, sc_balance)
  VALUES (NEW.id, 10000000, 200)
  ON CONFLICT (player_id) DO NOTHING;

  INSERT INTO public.casino_transactions (player_id, type, currency, amount, balance_after, metadata)
  VALUES (NEW.id, 'signup_bonus', 'gc', 10000000, 10000000, '{"reason":"welcome_bonus"}'::jsonb);

  INSERT INTO public.casino_transactions (player_id, type, currency, amount, balance_after, metadata)
  VALUES (NEW.id, 'signup_bonus', 'sc', 200, 200, '{"reason":"welcome_bonus"}'::jsonb);

  INSERT INTO public.casino_notifications (player_id, type, title, body, icon, read)
  VALUES (NEW.id, 'system', 'Welcome to CrownCoins!', 'You received GC 100,000 + SC 2.00 as a welcome bonus!', 'crown', false);

  INSERT INTO public.casino_responsible_gaming (player_id)
  VALUES (NEW.id)
  ON CONFLICT (player_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created_casino ON auth.users;
CREATE TRIGGER on_auth_user_created_casino
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_casino_player();
;
