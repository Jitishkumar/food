-- ============================================
-- Add City and State fields to businesses and food_items tables
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- Add city and state columns to businesses table
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT;

-- Add city and state columns to food_items table
ALTER TABLE food_items
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT;

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_businesses_city_state ON businesses(city, state);
CREATE INDEX IF NOT EXISTS idx_food_items_city_state ON food_items(city, state);

-- Create an updated search function that includes city and state filtering
CREATE OR REPLACE FUNCTION search_food_items_by_location(
  user_lat DOUBLE PRECISION,
  user_lon DOUBLE PRECISION,
  search_radius INTEGER,
  search_query TEXT DEFAULT NULL,
  search_category UUID DEFAULT NULL,
  search_city TEXT DEFAULT NULL,
  search_state TEXT DEFAULT NULL
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
  total_reviews BIGINT,
  city TEXT,
  state TEXT,
  business_city TEXT,
  business_state TEXT
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
    COALESCE((SELECT COUNT(*) FROM food_item_reviews WHERE food_item_id = fi.id), 0) as total_reviews,
    fi.city,
    fi.state,
    b.city,
    b.state
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
    AND (search_city IS NULL OR LOWER(fi.city) = LOWER(search_city) OR LOWER(b.city) = LOWER(search_city))
    AND (search_state IS NULL OR LOWER(fi.state) = LOWER(search_state) OR LOWER(b.state) = LOWER(search_state))
  ORDER BY 
    -- Priority 1: Food name, city, and state all match
    CASE 
      WHEN LOWER(fi.name) ILIKE '%' || LOWER(search_query) || '%' 
        AND LOWER(fi.city) = LOWER(search_city) 
        AND LOWER(fi.state) = LOWER(search_state) THEN 1
      -- Priority 2: City and state match
      WHEN (LOWER(fi.city) = LOWER(search_city) OR LOWER(b.city) = LOWER(search_city))
        AND (LOWER(fi.state) = LOWER(search_state) OR LOWER(b.state) = LOWER(search_state)) THEN 2
      -- Priority 3: State matches
      WHEN LOWER(fi.state) = LOWER(search_state) OR LOWER(b.state) = LOWER(search_state) THEN 3
      ELSE 4
    END,
    distance;
END;
$$ LANGUAGE plpgsql;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('businesses', 'food_items')
AND column_name IN ('city', 'state')
ORDER BY table_name, ordinal_position;
