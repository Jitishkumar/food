-- ============================================
-- Food Item Reviews and Reports System
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- Create reviews table for food items
CREATE TABLE IF NOT EXISTS food_item_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_item_id UUID NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(food_item_id, user_id)
);

-- Create reports table for food items
CREATE TABLE IF NOT EXISTS food_item_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_item_id UUID NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_food_item_reviews_food_item_id ON food_item_reviews(food_item_id);
CREATE INDEX IF NOT EXISTS idx_food_item_reviews_user_id ON food_item_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_food_item_reports_food_item_id ON food_item_reports(food_item_id);
CREATE INDEX IF NOT EXISTS idx_food_item_reports_status ON food_item_reports(status);

-- Enable Row Level Security
ALTER TABLE food_item_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_item_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view reviews" ON food_item_reviews;
DROP POLICY IF EXISTS "Users can create their own reviews" ON food_item_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON food_item_reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON food_item_reviews;
DROP POLICY IF EXISTS "Users can view their own reports" ON food_item_reports;
DROP POLICY IF EXISTS "Users can create reports" ON food_item_reports;

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews" ON food_item_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own reviews" ON food_item_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON food_item_reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON food_item_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for reports
CREATE POLICY "Users can view their own reports" ON food_item_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create reports" ON food_item_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to get average rating for a food item
CREATE OR REPLACE FUNCTION get_food_item_rating(item_id UUID)
RETURNS TABLE (
  average_rating NUMERIC,
  total_reviews BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(AVG(rating)::numeric, 1) as average_rating,
    COUNT(*) as total_reviews
  FROM food_item_reviews
  WHERE food_item_id = item_id;
END;
$$ LANGUAGE plpgsql;

-- Update the search function to include ratings
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
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
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
        cos(radians(b.latitude)) * 
        cos(radians(b.longitude) - radians(user_lon)) + 
        sin(radians(user_lat)) * 
        sin(radians(b.latitude))
      )
    ) as distance,
    fi.inventory_count,
    fi.allow_purchase,
    COALESCE((SELECT AVG(rating)::numeric FROM food_item_reviews WHERE food_item_id = fi.id), 0) as average_rating,
    COALESCE((SELECT COUNT(*) FROM food_item_reviews WHERE food_item_id = fi.id), 0) as total_reviews
  FROM food_items fi
  INNER JOIN businesses b ON fi.business_id = b.id
  LEFT JOIN categories c ON fi.category_id = c.id
  WHERE 
    (
      6371 * acos(
        cos(radians(user_lat)) * 
        cos(radians(b.latitude)) * 
        cos(radians(b.longitude) - radians(user_lon)) + 
        sin(radians(user_lat)) * 
        sin(radians(b.latitude))
      )
    ) <= search_radius
    AND (search_query IS NULL OR fi.name ILIKE '%' || search_query || '%' OR b.business_name ILIKE '%' || search_query || '%')
    AND (search_category IS NULL OR fi.category_id = search_category)
  ORDER BY distance;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_food_item_reviews_updated_at ON food_item_reviews;
CREATE TRIGGER update_food_item_reviews_updated_at
    BEFORE UPDATE ON food_item_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_food_item_reports_updated_at ON food_item_reports;
CREATE TRIGGER update_food_item_reports_updated_at
    BEFORE UPDATE ON food_item_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Verification Queries (Optional - for testing)
-- ============================================

-- Check if tables were created
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('food_item_reviews', 'food_item_reports');

-- Check if indexes were created
-- SELECT indexname FROM pg_indexes 
-- WHERE tablename IN ('food_item_reviews', 'food_item_reports');

-- Check if RLS is enabled
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE tablename IN ('food_item_reviews', 'food_item_reports');
