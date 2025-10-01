-- Food Discovery App Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('customer', 'owner')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Restaurant/Business profiles
CREATE TABLE IF NOT EXISTS businesses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL, -- restaurant, dhaba, sweet_shop, cafe, etc.
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

-- Food categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, icon) VALUES
  ('Sweets', '🍰'),
  ('Non-Veg', '🍗'),
  ('Veg', '🥗'),
  ('Beverages', '🥤'),
  ('Fast Food', '🍔'),
  ('Street Food', '🌮'),
  ('Desserts', '🍨'),
  ('Bakery', '🥖')
ON CONFLICT (name) DO NOTHING;

-- Special/Regional foods (admin curated)
CREATE TABLE IF NOT EXISTS special_foods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  region TEXT NOT NULL, -- district, state, country
  region_type TEXT NOT NULL CHECK (region_type IN ('district', 'state', 'country')),
  category_id UUID REFERENCES categories(id),
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Food items posted by businesses
CREATE TABLE IF NOT EXISTS food_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id),
  special_food_id UUID REFERENCES special_foods(id), -- link to special food if applicable
  price DECIMAL(10, 2),
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews and ratings
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  food_item_id UUID REFERENCES food_items(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_businesses_lat ON businesses(latitude);
CREATE INDEX IF NOT EXISTS idx_businesses_lon ON businesses(longitude);
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_food_items_business ON food_items(business_id);
CREATE INDEX IF NOT EXISTS idx_food_items_category ON food_items(category_id);
CREATE INDEX IF NOT EXISTS idx_reviews_business ON reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_special_foods_region ON special_foods(region);

-- Function to calculate distance between two points (in km)
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

-- Function to search businesses within range
CREATE OR REPLACE FUNCTION search_businesses_nearby(
  user_lat DECIMAL,
  user_lon DECIMAL,
  search_radius INTEGER, -- in km
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

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all, insert their own, and update their own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT 
  TO public
  USING (true);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id);

-- Businesses: Everyone can read, only owners can create/update their own
CREATE POLICY "Businesses are viewable by everyone" ON businesses
  FOR SELECT USING (true);

CREATE POLICY "Owners can create businesses" ON businesses
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own businesses" ON businesses
  FOR UPDATE USING (auth.uid() = owner_id);

-- Food items: Everyone can read, only business owners can manage
CREATE POLICY "Food items are viewable by everyone" ON food_items
  FOR SELECT USING (true);

CREATE POLICY "Business owners can create food items" ON food_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE id = food_items.business_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can update own food items" ON food_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE id = food_items.business_id AND owner_id = auth.uid()
    )
  );

-- Reviews: Everyone can read, authenticated users can create
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Special foods: Everyone can read (admin manages via Supabase dashboard)
CREATE POLICY "Special foods are viewable by everyone" ON special_foods
  FOR SELECT USING (true);








on clause
public.profiles
Policy Behavior
as clause
permissive
Policy Command
for clause

UPDATE

Target Roles
to clause
Defaults to all (public) roles if none selected
Use options above to edit
alter policy "Users can update own profile"
on "public"."profiles"
to public
using (
  (auth.uid() = id)
);


  Policy Name
Table
on clause
public.profiles
Policy Behavior
as clause
permissive
Policy Command
for clause

INSERT

Target Roles
to clause
Defaults to all (public) roles if none selected
Use options above to edit
alter policy "Users can insert own profile"
on "public"."profiles"
to public
with check (
  (auth.uid() = id)
);





Policy Name
Table
on clause
public.profiles
Policy Behavior
as clause
permissive
Policy Command
for clause
SELECT

Target Roles
to clause
Defaults to all (public) roles if none selected
Use options above to edit
alter policy "Public profiles are viewable by everyone"
on "public"."profiles"
to public
using (
  true
);

 i pasted all rls