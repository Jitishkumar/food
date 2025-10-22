-- ============================================
-- FIX: Type Mismatch Error for latitude/longitude
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- Drop the existing function first
DROP FUNCTION IF EXISTS search_food_items_nearby(DOUBLE PRECISION, DOUBLE PRECISION, INTEGER, TEXT, UUID);

-- Recreate the function with correct return types (NUMERIC instead of DOUBLE PRECISION for lat/lon)
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
  latitude NUMERIC,  -- Changed from DOUBLE PRECISION to NUMERIC
  longitude NUMERIC, -- Changed from DOUBLE PRECISION to NUMERIC
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
    b.latitude,  -- Now returns NUMERIC as expected
    b.longitude, -- Now returns NUMERIC as expected
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

-- Verify the function was created successfully
SELECT 
  routine_name, 
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'search_food_items_nearby';
