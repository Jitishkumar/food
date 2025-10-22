-- ============================================
-- FIX: Foreign Key Relationship for Reviews
-- This fixes the PGRST200 error when querying reviews
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- First, let's check if the tables exist and their structure
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name IN ('food_item_reviews', 'food_item_reports')
-- ORDER BY table_name, ordinal_position;

-- Drop existing foreign key constraints if they exist
ALTER TABLE food_item_reviews 
DROP CONSTRAINT IF EXISTS food_item_reviews_user_id_fkey;

ALTER TABLE food_item_reports 
DROP CONSTRAINT IF EXISTS food_item_reports_user_id_fkey;

-- Recreate the foreign key constraints with proper naming
ALTER TABLE food_item_reviews
ADD CONSTRAINT food_item_reviews_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

ALTER TABLE food_item_reports
ADD CONSTRAINT food_item_reports_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Create a view to make it easier to query reviews with user info
CREATE OR REPLACE VIEW food_item_reviews_with_users AS
SELECT 
  r.id,
  r.food_item_id,
  r.user_id,
  r.rating,
  r.review_text,
  r.created_at,
  r.updated_at,
  p.full_name as user_name
FROM food_item_reviews r
LEFT JOIN profiles p ON r.user_id = p.id;

-- Grant access to the view
GRANT SELECT ON food_item_reviews_with_users TO authenticated;
GRANT SELECT ON food_item_reviews_with_users TO anon;

-- Create a function to get reviews for a food item with user details
CREATE OR REPLACE FUNCTION get_food_item_reviews_with_users(item_id UUID)
RETURNS TABLE (
  id UUID,
  food_item_id UUID,
  user_id UUID,
  rating INTEGER,
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  user_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.food_item_id,
    r.user_id,
    r.rating,
    r.review_text,
    r.created_at,
    r.updated_at,
    COALESCE(p.full_name, 'Anonymous') as user_name
  FROM food_item_reviews r
  LEFT JOIN profiles p ON r.user_id = p.id
  WHERE r.food_item_id = item_id
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_food_item_reviews_with_users(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_food_item_reviews_with_users(UUID) TO anon;

-- Verify the foreign keys were created
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('food_item_reviews', 'food_item_reports');
