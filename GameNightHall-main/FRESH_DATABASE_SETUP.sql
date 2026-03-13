-- ============================================================
-- GAMEPARK - Full Database Setup Script
-- Run this ONCE in your new Supabase project's SQL Editor
-- ============================================================


-- ============================================================
-- 1. SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default settings
INSERT INTO settings (key, value) VALUES
  ('clubName', 'GameNightHall'),
  ('currency', 'TND'),
  ('hourlyRate', '10'),
  ('tableCount', '4'),
  ('lowStockThreshold', '5')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read settings" ON settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to modify settings" ON settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ============================================================
-- 2. COUNTERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('billard', 'playstation', 'playstation4', 'playstation5')),
  order_index INTEGER NOT NULL,
  active BOOLEAN DEFAULT FALSE,
  start_time TIMESTAMPTZ,
  drinks JSONB DEFAULT '[]'::jsonb,
  started_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_counters_type ON counters(type);
CREATE INDEX IF NOT EXISTS idx_counters_order ON counters(order_index);
CREATE INDEX IF NOT EXISTS idx_counters_active ON counters(active) WHERE active = TRUE;

-- Default counters: 4 Billiard tables + 9 PlayStation 5 stations
INSERT INTO counters (name, type, order_index) VALUES
  ('Table 1',   'billard',      1),
  ('Table 2',   'billard',      2),
  ('Table 3',   'billard',      3),
  ('Table 4',   'billard',      4),
  ('PS5 - 1',   'playstation5', 5),
  ('PS5 - 2',   'playstation5', 6),
  ('PS5 - 3',   'playstation5', 7),
  ('PS5 - 4',   'playstation5', 8),
  ('PS5 - 5',   'playstation5', 9),
  ('PS5 - 6',   'playstation5', 10),
  ('PS5 - 7',   'playstation5', 11),
  ('PS5 - 8',   'playstation5', 12),
  ('PS5 - 9',   'playstation5', 13);

-- Enable RLS
ALTER TABLE counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read counters" ON counters
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to modify counters" ON counters
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ============================================================
-- 3. COUNTER SETTINGS TABLE
-- (pricing model per counter type, intervals in SECONDS)
-- ============================================================
CREATE TABLE IF NOT EXISTS counter_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  counter_type TEXT NOT NULL UNIQUE CHECK (counter_type IN ('billard', 'playstation', 'playstation4', 'playstation5')),
  starting_value NUMERIC DEFAULT 0,
  increment_amount NUMERIC NOT NULL,
  increment_interval_seconds NUMERIC NOT NULL,
  grace_period_seconds NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default pricing:
--   Billard : starts at 0 TND, +2 TND every 15 min (900s), 5 min (300s) grace
--   PS5     : starts at 1 TND, +1 TND every 10 min (600s), no grace
INSERT INTO counter_settings (counter_type, starting_value, increment_amount, increment_interval_seconds, grace_period_seconds) VALUES
  ('billard',      0, 2, 900, 300),
  ('playstation5', 1, 1, 600,   0)
ON CONFLICT (counter_type) DO NOTHING;

-- Enable RLS
ALTER TABLE counter_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read counter_settings" ON counter_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to modify counter_settings" ON counter_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ============================================================
-- 4. PLAYERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read players" ON players
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to modify players" ON players
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ============================================================
-- 5. BILLS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  counter_id UUID REFERENCES counters(id) ON DELETE SET NULL,
  counter_type TEXT CHECK (counter_type IN ('billard', 'playstation', 'playstation4', 'playstation5')),
  table_number INTEGER,          -- kept for backward compatibility
  player_name TEXT,
  cashier_name TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration NUMERIC,              -- session duration in seconds
  price NUMERIC NOT NULL DEFAULT 0,
  paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  has_items BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bills_counter_id ON bills(counter_id);
CREATE INDEX IF NOT EXISTS idx_bills_paid ON bills(paid);
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON bills(created_at);

-- Enable RLS
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read bills" ON bills
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to modify bills" ON bills
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ============================================================
-- 6. DRINKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS drinks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  category TEXT DEFAULT 'other',
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drinks_available ON drinks(available);

-- Sample drinks (edit/delete as needed)
INSERT INTO drinks (name, price, category, available) VALUES
  ('Coca Cola',     2.00, 'soft_drinks',    true),
  ('Pepsi',         2.00, 'soft_drinks',    true),
  ('Fanta',         2.00, 'soft_drinks',    true),
  ('Sprite',        2.00, 'soft_drinks',    true),
  ('Eau Minérale',  1.00, 'water',          true),
  ('Café',          1.50, 'hot_drinks',     true),
  ('Cappuccino',    2.50, 'hot_drinks',     true),
  ('Thé',           1.00, 'hot_drinks',     true),
  ('Jus d''Orange', 3.00, 'juices',         true),
  ('Jus de Pomme',  3.00, 'juices',         true),
  ('Red Bull',      4.00, 'energy_drinks',  true),
  ('Monster',       4.00, 'energy_drinks',  true);

-- Enable RLS
ALTER TABLE drinks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read drinks" ON drinks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to modify drinks" ON drinks
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ============================================================
-- 7. BILL ITEMS TABLE
-- (line items: time-based charge + drinks per bill)
-- ============================================================
CREATE TABLE IF NOT EXISTS bill_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('counter', 'drink')),
  item_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON bill_items(bill_id);

-- Enable RLS
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read bill_items" ON bill_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to modify bill_items" ON bill_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ============================================================
-- 8. SET YOUR FIRST USER AS SUPERADMIN
-- Run this AFTER signing up / creating your first user.
-- Replace YOUR-USER-UUID with the UUID from:
--   Supabase Dashboard → Authentication → Users
-- ============================================================

-- UPDATE auth.users
-- SET raw_user_meta_data = jsonb_set(
--   COALESCE(raw_user_meta_data, '{}'::jsonb),
--   '{role}',
--   '"superadmin"'
-- )
-- WHERE id = 'YOUR-USER-UUID';

-- Optionally also set a display name:
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data || '{"name": "Your Name"}'::jsonb
-- WHERE id = 'YOUR-USER-UUID';


-- ============================================================
-- VERIFICATION QUERIES (run after the above to confirm)
-- ============================================================
SELECT 'settings'        AS tbl, COUNT(*) FROM settings
UNION ALL
SELECT 'counters',                COUNT(*) FROM counters
UNION ALL
SELECT 'counter_settings',        COUNT(*) FROM counter_settings
UNION ALL
SELECT 'players',                 COUNT(*) FROM players
UNION ALL
SELECT 'bills',                   COUNT(*) FROM bills
UNION ALL
SELECT 'drinks',                  COUNT(*) FROM drinks
UNION ALL
SELECT 'bill_items',              COUNT(*) FROM bill_items;
