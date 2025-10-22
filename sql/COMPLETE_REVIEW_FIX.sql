-- ============================================
-- COMPLETE FIX FOR REVIEWS SYSTEM
-- Run ALL of these SQL commands in your Supabase SQL Editor
-- ============================================

-- STEP 1: Fix the type mismatch error for search function
-- --------------------------------------------------------
DROP FUNCTION IF EXISTS search_food_items_nearby(DOUBLE PRECISION, DOUBLE PRECISION, INTEGER, TEXT, UUID);

CREATE OR REPLACE FUNCTION search_food_items_nearby(
  user_lat DOUBLE PRECISION,
  user_lon DOUBLE PRECISION,
  search_radius INTEGER,
  search_query TEXT DEFAULT NULL,
  search_category UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  price NUMERIC,
  category_id UUID,
  category_name TEXT,
  business_id UUID,
  business_name TEXT,
  phone_number TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  distance DOUBLE PRECISION,
  inventory_count INTEGER,
  allow_purchase BOOLEAN,
  average_rating NUMERIC,
  total_reviews BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fi.id,
    fi.name,
    fi.description,
    fi.price,
    fi.category_id,
    c.name as category_name,
    b.id as business_id,
    b.business_name,
    b.phone_number,
    b.latitude,
    b.longitude,
    (
      6371 * acos(
        cos(radians(user_lat)) * 
        cos(radians(b.latitude::double precision)) * 
        cos(radians(b.longitude::double precision) - radians(user_lon)) + 
        sin(radians(user_lat)) * 
        sin(radians(b.latitude::double precision))
      )
    ) as distance,
    fi.inventory_count,
    fi.allow_purchase,
    COALESCE(ROUND((SELECT AVG(rating)::numeric FROM food_item_reviews WHERE food_item_id = fi.id), 1), 0) as average_rating,
    COALESCE((SELECT COUNT(*) FROM food_item_reviews WHERE food_item_id = fi.id), 0) as total_reviews
  FROM food_items fi
  INNER JOIN businesses b ON fi.business_id = b.id
  LEFT JOIN categories c ON fi.category_id = c.id
  WHERE 
    (
      6371 * acos(
        cos(radians(user_lat)) * 
        cos(radians(b.latitude::double precision)) * 
        cos(radians(b.longitude::double precision) - radians(user_lon)) + 
        sin(radians(user_lat)) * 
        sin(radians(b.latitude::double precision))
      )
    ) <= search_radius
    AND (search_query IS NULL OR fi.name ILIKE '%' || search_query || '%' OR b.business_name ILIKE '%' || search_query || '%')
    AND (search_category IS NULL OR fi.category_id = search_category)
  ORDER BY distance;
END;
$$ LANGUAGE plpgsql;


-- STEP 2: Ensure foreign key constraints are properly set
-- --------------------------------------------------------
ALTER TABLE food_item_reviews 
DROP CONSTRAINT IF EXISTS food_item_reviews_user_id_fkey;

ALTER TABLE food_item_reports 
DROP CONSTRAINT IF EXISTS food_item_reports_user_id_fkey;

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


-- STEP 3: Create helper function to get reviews with user info
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_food_item_reviews_with_users(item_id UUID)
RETURNS TABLE (
  id UUID,
  food_item_id UUID,
  user_id UUID,
  rating INTEGER,
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  user_name TEXT,
  user_email TEXT
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
    COALESCE(p.full_name, 'Anonymous') as user_name,
    COALESCE(p.email, 'no-email') as user_email
  FROM food_item_reviews r
  LEFT JOIN profiles p ON r.user_id = p.id
  WHERE r.food_item_id = item_id
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_food_item_reviews_with_users(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_food_item_reviews_with_users(UUID) TO anon;


-- STEP 4: Verify everything is set up correctly
-- ----------------------------------------------
-- Check if tables exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name IN ('food_item_reviews', 'food_item_reports')
AND table_schema = 'public';

-- Check foreign keys
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('food_item_reviews', 'food_item_reports');

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('food_item_reviews', 'food_item_reports');

-- ============================================
-- SUCCESS! Your reviews system is now ready
-- ============================================
