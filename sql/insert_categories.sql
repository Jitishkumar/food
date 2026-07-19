-- ============================================
-- INSERT DEFAULT FOOD CATEGORIES
-- Run this in Supabase SQL Editor
-- ============================================

-- Create categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default food categories
INSERT INTO categories (name, icon) VALUES
  ('Indian', '🍛'),
  ('Chinese', '🥢'),
  ('Italian', '🍝'),
  ('Fast Food', '🍔'),
  ('Desserts', '🍰'),
  ('Beverages', '🥤'),
  ('Street Food', '🌮'),
  ('Bakery', '🥖'),
  ('Continental', '🍽️'),
  ('South Indian', '🥘'),
  ('North Indian', '🍜'),
  ('Mexican', '🌯'),
  ('Thai', '🍲'),
  ('Japanese', '🍱'),
  ('Korean', '🍚'),
  ('Pizza', '🍕'),
  ('Burgers', '🍔'),
  ('Sandwiches', '🥪'),
  ('Salads', '🥗'),
  ('Breakfast', '🍳'),
  ('Snacks', '🍿'),
  ('Ice Cream', '🍦'),
  ('Cakes', '🎂'),
  ('Coffee', '☕'),
  ('Tea', '🍵'),
  ('Juice', '🧃'),
  ('Smoothies', '🥤'),
  ('Seafood', '🦞'),
  ('Vegan', '🥬'),
  ('Healthy', '🥗')
ON CONFLICT (name) DO NOTHING;

-- Verify insertion
SELECT COUNT(*) as total_categories FROM categories;

-- Show all categories
SELECT * FROM categories ORDER BY name;
