-- COMPLETE DATABASE RESET
-- Run this to start fresh with correct RLS policies

-- Step 1: Drop all tables (CASCADE will handle foreign keys)
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS food_items CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;
DROP TABLE IF EXISTS special_foods CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Step 2: Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('customer', 'owner')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create other tables
CREATE TABLE businesses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE special_foods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  region TEXT NOT NULL,
  region_type TEXT NOT NULL CHECK (region_type IN ('district', 'state', 'country')),
  category_id UUID REFERENCES categories(id),
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE food_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id),
  special_food_id UUID REFERENCES special_foods(id),
  price DECIMAL(10, 2),
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  food_item_id UUID REFERENCES food_items(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create indexes
CREATE INDEX idx_businesses_lat ON businesses(latitude);
CREATE INDEX idx_businesses_lon ON businesses(longitude);
CREATE INDEX idx_businesses_owner ON businesses(owner_id);
CREATE INDEX idx_food_items_business ON food_items(business_id);
CREATE INDEX idx_food_items_category ON food_items(category_id);
CREATE INDEX idx_reviews_business ON reviews(business_id);
CREATE INDEX idx_special_foods_region ON special_foods(region);

-- Step 5: Create distance calculation function
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL, lon1 DECIMAL, lat2 DECIMAL, lon2 DECIMAL
)
RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    6371 * acos(
      cos(radians(lat1)) * cos(radians(lat2)) * 
      cos(radians(lon2) - radians(lon1)) + 
      sin(radians(lat1)) * sin(radians(lat2))
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 6: Create search function
CREATE OR REPLACE FUNCTION search_businesses_nearby(
  user_lat DECIMAL,
  user_lon DECIMAL,
  search_radius INTEGER,
  search_category UUID DEFAULT NULL,
  search_query TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  business_name TEXT,
  business_type TEXT,
  phone_number TEXT,
  address TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  description TEXT,
  image_url TEXT,
  distance DECIMAL,
  avg_rating DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.business_name,
    b.business_type,
    b.phone_number,
    b.address,
    b.latitude,
    b.longitude,
    b.description,
    b.image_url,
    calculate_distance(user_lat, user_lon, b.latitude, b.longitude) as distance,
    COALESCE(AVG(r.rating), 0) as avg_rating
  FROM businesses b
  LEFT JOIN food_items fi ON b.id = fi.business_id
  LEFT JOIN reviews r ON b.id = r.business_id
  WHERE 
    b.is_active = true
    AND calculate_distance(user_lat, user_lon, b.latitude, b.longitude) <= search_radius
    AND (search_category IS NULL OR fi.category_id = search_category)
    AND (search_query IS NULL OR 
         b.business_name ILIKE '%' || search_query || '%' OR
         fi.name ILIKE '%' || search_query || '%')
  GROUP BY b.id
  ORDER BY distance ASC;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies for profiles
CREATE POLICY "Anyone can view profiles" 
ON profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
TO authenticated
USING (auth.uid() = id);

-- Step 9: Create RLS policies for businesses
CREATE POLICY "Businesses are viewable by everyone" 
ON businesses FOR SELECT 
USING (true);

CREATE POLICY "Owners can create businesses" 
ON businesses FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own businesses" 
ON businesses FOR UPDATE 
TO authenticated
USING (auth.uid() = owner_id);

-- Step 10: Create RLS policies for food_items
CREATE POLICY "Food items are viewable by everyone" 
ON food_items FOR SELECT 
USING (true);

CREATE POLICY "Business owners can create food items" 
ON food_items FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses 
    WHERE id = food_items.business_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Business owners can update own food items" 
ON food_items FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM businesses 
    WHERE id = food_items.business_id AND owner_id = auth.uid()
  )
);

-- Step 11: Create RLS policies for reviews
CREATE POLICY "Reviews are viewable by everyone" 
ON reviews FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create reviews" 
ON reviews FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Step 12: Insert default categories
INSERT INTO categories (name, icon) VALUES
  ('Sweets', '🍰'),
  ('Non-Veg', '🍗'),
  ('Veg', '🥗'),
  ('Beverages', '🥤'),
  ('Fast Food', '🍔'),
  ('Street Food', '🌮'),
  ('Desserts', '🍨'),
  ('Bakery', '🥖');

-- Step 13: Verify everything
SELECT 'Database reset complete! ✅' as message;
SELECT COUNT(*) as total_policies FROM pg_policies WHERE tablename IN ('profiles', 'businesses', 'food_items', 'reviews');
SELECT COUNT(*) as total_categories FROM categories;
