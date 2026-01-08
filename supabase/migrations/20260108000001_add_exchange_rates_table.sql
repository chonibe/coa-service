-- Create Exchange Rates table and seed with initial values
-- This allows the system to move away from hardcoded rates.

CREATE TABLE IF NOT EXISTS exchange_rates (
  id SERIAL PRIMARY KEY,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL DEFAULT 'USD',
  rate DECIMAL(15, 6) NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_currency, to_currency)
);

-- Seed with current conservative values
INSERT INTO exchange_rates (from_currency, to_currency, rate)
VALUES 
  ('GBP', 'USD', 1.27),
  ('NIS', 'USD', 0.27),
  ('ILS', 'USD', 0.27)
ON CONFLICT (from_currency, to_currency) 
DO UPDATE SET rate = EXCLUDED.rate, last_updated = NOW();

