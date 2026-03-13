-- Migration: Add stock tracking to drinks table
-- Run this in Supabase SQL Editor

ALTER TABLE drinks
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT NULL;

-- NULL means "no stock tracking" for that drink.
-- A value of 0 means the drink is out of stock.

-- (Optional) pre-fill stock for existing drinks if you want a starting quantity:
-- UPDATE drinks SET stock = 50;

-- Verify
SELECT id, name, price, available, stock FROM drinks ORDER BY category, name;
