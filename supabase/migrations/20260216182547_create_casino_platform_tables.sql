
-- ============================================================
-- CASINO PLATFORM SCHEMA
-- ============================================================

-- Enum types
CREATE TYPE casino_transaction_type AS ENUM (
  'purchase', 'bonus', 'spin_bet', 'spin_win', 'redeem',
  'daily_bonus', 'hourly_bonus', 'signup_bonus', 'referral',
  'level_up_bonus'
);

CREATE TYPE casino_currency AS ENUM ('gc', 'sc');

CREATE TYPE casino_game_type AS ENUM ('slots', 'table', 'instant');

CREATE TYPE casino_volatility AS ENUM ('low', 'medium', 'medium-high', 'high');

CREATE TYPE casino_vip_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'diamond');

CREATE TYPE casino_redeem_status AS ENUM ('pending', 'under_review', 'approved', 'completed', 'rejected');

-- ============================================================
-- casino_players
-- ============================================================
CREATE TABLE casino_players (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  level INT NOT NULL DEFAULT 1,
  xp BIGINT NOT NULL DEFAULT 0,
  vip_tier casino_vip_tier NOT NULL DEFAULT 'bronze',
  first_purchase_made BOOLEAN NOT NULL DEFAULT FALSE,
  kyc_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- casino_wallets
-- ============================================================
CREATE TABLE casino_wallets (
  player_id UUID PRIMARY KEY REFERENCES casino_players(id) ON DELETE CASCADE,
  gc_balance BIGINT NOT NULL DEFAULT 0,
  sc_balance BIGINT NOT NULL DEFAULT 0,
  lifetime_gc_purchased BIGINT NOT NULL DEFAULT 0,
  lifetime_sc_won BIGINT NOT NULL DEFAULT 0,
  lifetime_sc_redeemed BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- casino_transactions
-- ============================================================
CREATE TABLE casino_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES casino_players(id) ON DELETE CASCADE,
  type casino_transaction_type NOT NULL,
  currency casino_currency NOT NULL,
  amount BIGINT NOT NULL,
  balance_after BIGINT NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_casino_transactions_player ON casino_transactions(player_id, created_at DESC);
CREATE INDEX idx_casino_transactions_type ON casino_transactions(type, created_at DESC);

-- ============================================================
-- casino_spins (audit trail for every spin)
-- ============================================================
CREATE TABLE casino_spins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES casino_players(id) ON DELETE CASCADE,
  game_id UUID,
  bet_per_line BIGINT NOT NULL,
  total_bet BIGINT NOT NULL,
  currency casino_currency NOT NULL,
  grid JSONB NOT NULL,
  payline_wins JSONB DEFAULT '[]',
  scatter_count INT NOT NULL DEFAULT 0,
  total_win BIGINT NOT NULL DEFAULT 0,
  is_free_spin BOOLEAN NOT NULL DEFAULT FALSE,
  multiplier INT NOT NULL DEFAULT 1,
  server_seed TEXT NOT NULL,
  client_seed TEXT NOT NULL DEFAULT '',
  nonce BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_casino_spins_player ON casino_spins(player_id, created_at DESC);

-- ============================================================
-- casino_daily_claims
-- ============================================================
CREATE TABLE casino_daily_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES casino_players(id) ON DELETE CASCADE,
  claim_date DATE NOT NULL DEFAULT CURRENT_DATE,
  day_streak INT NOT NULL DEFAULT 1,
  gc_awarded BIGINT NOT NULL DEFAULT 0,
  sc_awarded BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(player_id, claim_date)
);

CREATE INDEX idx_casino_daily_claims_player ON casino_daily_claims(player_id, claim_date DESC);

-- ============================================================
-- casino_store_packages
-- ============================================================
CREATE TABLE casino_store_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  gc_amount BIGINT NOT NULL,
  sc_bonus BIGINT NOT NULL DEFAULT 0,
  price_cents INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  badge TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0
);

-- ============================================================
-- casino_notifications
-- ============================================================
CREATE TABLE casino_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES casino_players(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  icon TEXT,
  action_url TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_casino_notifications_player ON casino_notifications(player_id, read, created_at DESC);

-- ============================================================
-- casino_responsible_gaming
-- ============================================================
CREATE TABLE casino_responsible_gaming (
  player_id UUID PRIMARY KEY REFERENCES casino_players(id) ON DELETE CASCADE,
  daily_deposit_limit BIGINT,
  weekly_deposit_limit BIGINT,
  monthly_deposit_limit BIGINT,
  session_time_limit_minutes INT,
  loss_limit_daily BIGINT,
  cooloff_until TIMESTAMPTZ,
  self_excluded_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- casino_games (game catalog)
-- ============================================================
CREATE TABLE casino_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT,
  type casino_game_type NOT NULL DEFAULT 'slots',
  rtp NUMERIC(5,2) NOT NULL DEFAULT 96.00,
  volatility casino_volatility NOT NULL DEFAULT 'medium-high',
  min_bet BIGINT NOT NULL DEFAULT 20,
  max_bet BIGINT NOT NULL DEFAULT 10000,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0
);

-- ============================================================
-- casino_redemptions
-- ============================================================
CREATE TABLE casino_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES casino_players(id) ON DELETE CASCADE,
  sc_amount BIGINT NOT NULL,
  usd_amount BIGINT NOT NULL,
  status casino_redeem_status NOT NULL DEFAULT 'pending',
  kyc_data JSONB DEFAULT '{}',
  reviewed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_casino_redemptions_player ON casino_redemptions(player_id, created_at DESC);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE casino_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE casino_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE casino_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE casino_spins ENABLE ROW LEVEL SECURITY;
ALTER TABLE casino_daily_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE casino_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE casino_responsible_gaming ENABLE ROW LEVEL SECURITY;
ALTER TABLE casino_store_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE casino_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE casino_redemptions ENABLE ROW LEVEL SECURITY;

-- Players: users can read/update their own row
CREATE POLICY "Players can read own profile" ON casino_players FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Players can update own profile" ON casino_players FOR UPDATE USING (auth.uid() = id);

-- Wallets: users can read their own wallet
CREATE POLICY "Players can read own wallet" ON casino_wallets FOR SELECT USING (auth.uid() = player_id);

-- Transactions: users can read their own transactions
CREATE POLICY "Players can read own transactions" ON casino_transactions FOR SELECT USING (auth.uid() = player_id);

-- Spins: users can read their own spins
CREATE POLICY "Players can read own spins" ON casino_spins FOR SELECT USING (auth.uid() = player_id);

-- Daily claims: users can read their own claims
CREATE POLICY "Players can read own daily claims" ON casino_daily_claims FOR SELECT USING (auth.uid() = player_id);

-- Notifications: users can read and update their own
CREATE POLICY "Players can read own notifications" ON casino_notifications FOR SELECT USING (auth.uid() = player_id);
CREATE POLICY "Players can update own notifications" ON casino_notifications FOR UPDATE USING (auth.uid() = player_id);

-- Responsible gaming: users can read and update their own
CREATE POLICY "Players can read own rg settings" ON casino_responsible_gaming FOR SELECT USING (auth.uid() = player_id);
CREATE POLICY "Players can update own rg settings" ON casino_responsible_gaming FOR UPDATE USING (auth.uid() = player_id);
CREATE POLICY "Players can insert own rg settings" ON casino_responsible_gaming FOR INSERT WITH CHECK (auth.uid() = player_id);

-- Store packages: everyone can read (public catalog)
CREATE POLICY "Anyone can read store packages" ON casino_store_packages FOR SELECT USING (true);

-- Games: everyone can read (public catalog)
CREATE POLICY "Anyone can read games" ON casino_games FOR SELECT USING (true);

-- Redemptions: users can read their own
CREATE POLICY "Players can read own redemptions" ON casino_redemptions FOR SELECT USING (auth.uid() = player_id);

-- ============================================================
-- SEED DATA: Store Packages
-- ============================================================
INSERT INTO casino_store_packages (name, gc_amount, sc_bonus, price_cents, badge, sort_order) VALUES
  ('Starter',  1000000,   30, 199,  NULL,         1),
  ('Popular',  5000000,  250, 499,  'Popular',    2),
  ('Value',   20000000, 1000, 1499, NULL,         3),
  ('Premium', 50000000, 3000, 2999, 'Best Value', 4),
  ('VIP',    150000000, 7500, 5999, NULL,         5),
  ('Whale',  500000000, 20000, 9999, 'VIP Only',  6);

-- ============================================================
-- SEED DATA: Game Catalog
-- ============================================================
INSERT INTO casino_games (slug, name, description, type, rtp, volatility, active, featured, sort_order) VALUES
  ('crown-jewels', 'Crown Jewels', '5-reel, 20-payline classic slot with wilds, scatters, and free spins. Medium-high volatility with 96% RTP.', 'slots', 96.00, 'medium-high', TRUE, TRUE, 1),
  ('pharaohs-fortune', 'Pharaoh''s Fortune', 'Ancient Egyptian themed slot with expanding wilds and multiplier free spins.', 'slots', 95.50, 'high', FALSE, FALSE, 2),
  ('lucky-leprechaun', 'Lucky Leprechaun', 'Irish-themed slot with rainbow bonus round and pot-of-gold jackpot feature.', 'slots', 96.20, 'medium', FALSE, FALSE, 3),
  ('dragons-hoard', 'Dragon''s Hoard', 'Fantasy slot with cascading reels and dragon fire bonus multipliers.', 'slots', 95.80, 'high', FALSE, TRUE, 4),
  ('cosmic-cash', 'Cosmic Cash', 'Space-themed slot with cluster pays and orbital free spins.', 'slots', 96.50, 'medium-high', FALSE, FALSE, 5);

-- ============================================================
-- FUNCTION: Create player profile + wallet on signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_casino_player()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO casino_players (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'Player'));

  INSERT INTO casino_wallets (player_id, gc_balance, sc_balance)
  VALUES (NEW.id, 10000000, 200);

  INSERT INTO casino_transactions (player_id, type, currency, amount, balance_after, metadata)
  VALUES (NEW.id, 'signup_bonus', 'gc', 10000000, 10000000, '{"reason":"signup_bonus"}');

  INSERT INTO casino_transactions (player_id, type, currency, amount, balance_after, metadata)
  VALUES (NEW.id, 'signup_bonus', 'sc', 200, 200, '{"reason":"signup_bonus"}');

  INSERT INTO casino_notifications (player_id, type, title, body, icon)
  VALUES (NEW.id, 'system', 'Welcome to CrownCoins!', 'You received GC 100,000 + SC 2.00 as a welcome bonus. Good luck!', '🎉');

  INSERT INTO casino_responsible_gaming (player_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_casino
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_casino_player();
;
