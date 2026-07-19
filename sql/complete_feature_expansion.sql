-- ============================================
-- COMPLETE FEATURE EXPANSION SQL
-- Purchase Codes, Coins System, Service Marketplace
-- ============================================

-- 1. Purchase Codes Table (Removed - using simpler payment_requests)

-- 1. Payment Requests Table (Simpler approach)
CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_item_id UUID NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'declined', 'expired')),
  amount DECIMAL(10, 2),
  qr_shown BOOLEAN DEFAULT FALSE,
  coins_awarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_payment_requests_customer ON payment_requests(customer_id);
CREATE INDEX idx_payment_requests_business ON payment_requests(business_id);
CREATE INDEX idx_payment_requests_status ON payment_requests(status);
CREATE INDEX idx_payment_requests_expires ON payment_requests(expires_at);

-- 2. User Coins System
CREATE TABLE IF NOT EXISTS user_coins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 0 CHECK (balance >= 0),
  earned_total INTEGER DEFAULT 0,
  spent_total INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_coins_user ON user_coins(user_id);

-- 3. Coin Transactions Table
CREATE TABLE IF NOT EXISTS coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('earned', 'spent', 'refund')),
  source VARCHAR(50) NOT NULL CHECK (source IN ('purchase', 'referral', 'bonus', 'redemption', 'review')),
  related_id UUID, -- can be purchase_code_id, service_id, etc.
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_coin_transactions_user ON coin_transactions(user_id);
CREATE INDEX idx_coin_transactions_type ON coin_transactions(type);

-- 4. Service Categories Table
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default service categories
INSERT INTO service_categories (name, icon, description) VALUES
('Jobs', '💼', 'Employment opportunities'),
('Rooms for Rent', '🏠', 'Room and housing rentals'),
('Freelance', '💻', 'Freelance services and projects'),
('Drivers', '🚗', 'Driver services'),
('Event Services', '🎭', 'Dancers, performers, event staff'),
('Home Services', '🔧', 'Repairs, cleaning, maintenance'),
('Tutoring', '📚', 'Educational services'),
('Other Services', '⭐', 'Miscellaneous services')
ON CONFLICT (name) DO NOTHING;

-- 5. Services Marketplace Table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  price_type VARCHAR(20) NOT NULL CHECK (price_type IN ('hourly', 'daily', 'monthly', 'fixed', 'negotiable')),
  price DECIMAL(10, 2),
  currency VARCHAR(10) DEFAULT 'INR',
  location_type VARCHAR(20) DEFAULT 'local' CHECK (location_type IN ('local', 'remote', 'hybrid')),
  city VARCHAR(100),
  state VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone_number VARCHAR(20),
  whatsapp_number VARCHAR(20),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  views_count INTEGER DEFAULT 0,
  contact_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  image_urls TEXT[], -- Array of image URLs
  availability TEXT, -- e.g., "Mon-Fri 9AM-5PM"
  experience_years INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_services_owner ON services(owner_id);
CREATE INDEX idx_services_category ON services(category_id);
CREATE INDEX idx_services_active ON services(is_active);
CREATE INDEX idx_services_location ON services(city, state);

-- 6. Service Reviews Table
CREATE TABLE IF NOT EXISTS service_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(service_id, user_id)
);

CREATE INDEX idx_service_reviews_service ON service_reviews(service_id);
CREATE INDEX idx_service_reviews_user ON service_reviews(user_id);

-- 7. Add payment QR code to businesses
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS payment_qr_url TEXT,
ADD COLUMN IF NOT EXISTS upi_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- 8. Add WhatsApp number to businesses
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);

-- 9. Add payment details to food_items (item-specific payment)
ALTER TABLE food_items
ADD COLUMN IF NOT EXISTS payment_qr_url TEXT,
ADD COLUMN IF NOT EXISTS upi_id VARCHAR(100);

-- ============================================
-- TRIGGERS AND FUNCTIONS
-- ============================================

-- Function to award coins after payment completion
CREATE OR REPLACE FUNCTION award_payment_coins()
RETURNS TRIGGER AS $$
DECLARE
  coins_to_award INTEGER := 2; -- 2 coins per purchase
BEGIN
  -- Only award coins when status changes to completed and coins haven't been awarded
  IF NEW.status = 'completed' AND NEW.coins_awarded = FALSE THEN
    -- Insert or update user_coins
    INSERT INTO user_coins (user_id, balance, earned_total)
    VALUES (NEW.customer_id, coins_to_award, coins_to_award)
    ON CONFLICT (user_id) DO UPDATE
    SET balance = user_coins.balance + coins_to_award,
        earned_total = user_coins.earned_total + coins_to_award,
        updated_at = NOW();
    
    -- Record transaction
    INSERT INTO coin_transactions (user_id, amount, type, source, related_id, description)
    VALUES (
      NEW.customer_id,
      coins_to_award,
      'earned',
      'purchase',
      NEW.id,
      'Payment completed and verified'
    );
    
    -- Mark coins as awarded
    NEW.coins_awarded := TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for awarding coins
DROP TRIGGER IF EXISTS award_coins_on_payment ON payment_requests;
CREATE TRIGGER award_coins_on_payment
  BEFORE UPDATE ON payment_requests
  FOR EACH ROW
  EXECUTE FUNCTION award_payment_coins();

-- Function to update service average rating
CREATE OR REPLACE FUNCTION update_service_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE services
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM service_reviews
      WHERE service_id = COALESCE(NEW.service_id, OLD.service_id)
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM service_reviews
      WHERE service_id = COALESCE(NEW.service_id, OLD.service_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.service_id, OLD.service_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for service rating updates
DROP TRIGGER IF EXISTS service_review_rating_update ON service_reviews;
CREATE TRIGGER service_review_rating_update
  AFTER INSERT OR UPDATE OR DELETE ON service_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_service_rating();

-- Function to update business average rating from food_item_reviews
CREATE OR REPLACE FUNCTION update_business_rating_from_food_reviews()
RETURNS TRIGGER AS $$
DECLARE
  biz_id UUID;
BEGIN
  -- Get business_id from food_item
  SELECT business_id INTO biz_id
  FROM food_items
  WHERE id = COALESCE(NEW.food_item_id, OLD.food_item_id);
  
  -- Update business rating based on all food item reviews
  UPDATE businesses
  SET 
    average_rating = (
      SELECT COALESCE(AVG(fir.rating), 0)
      FROM food_item_reviews fir
      JOIN food_items fi ON fi.id = fir.food_item_id
      WHERE fi.business_id = biz_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM food_item_reviews fir
      JOIN food_items fi ON fi.id = fir.food_item_id
      WHERE fi.business_id = biz_id
    )
  WHERE id = biz_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for business rating updates
DROP TRIGGER IF EXISTS business_rating_from_food_reviews ON food_item_reviews;
CREATE TRIGGER business_rating_from_food_reviews
  AFTER INSERT OR UPDATE OR DELETE ON food_item_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_business_rating_from_food_reviews();

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_reviews ENABLE ROW LEVEL SECURITY;

-- Payment requests policies
CREATE POLICY "Users can view their own payment requests"
  ON payment_requests FOR SELECT
  USING (auth.uid() = customer_id OR auth.uid() IN (SELECT owner_id FROM businesses WHERE id = business_id));

CREATE POLICY "Users can create payment requests"
  ON payment_requests FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Owners can update their business payment requests"
  ON payment_requests FOR UPDATE
  USING (auth.uid() IN (SELECT owner_id FROM businesses WHERE id = business_id));

-- User coins policies
CREATE POLICY "Users can view their own coins"
  ON user_coins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own coins record"
  ON user_coins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Coin transactions policies
CREATE POLICY "Users can view their own transactions"
  ON coin_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Service categories policies (public read)
CREATE POLICY "Anyone can view service categories"
  ON service_categories FOR SELECT
  TO public
  USING (true);

-- Services policies
CREATE POLICY "Anyone can view active services"
  ON services FOR SELECT
  USING (is_active = true OR auth.uid() = owner_id);

CREATE POLICY "Users can create their own services"
  ON services FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own services"
  ON services FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own services"
  ON services FOR DELETE
  USING (auth.uid() = owner_id);

-- Service reviews policies
CREATE POLICY "Anyone can view service reviews"
  ON service_reviews FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create service reviews"
  ON service_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own service reviews"
  ON service_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own service reviews"
  ON service_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to search services nearby
CREATE OR REPLACE FUNCTION search_services_nearby(
  user_lat DECIMAL,
  user_lon DECIMAL,
  search_radius INTEGER DEFAULT 50, -- in kilometers
  search_query TEXT DEFAULT NULL,
  search_category UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  owner_id UUID,
  category_id UUID,
  category_name TEXT,
  title TEXT,
  description TEXT,
  price_type VARCHAR,
  price DECIMAL,
  currency VARCHAR,
  location_type VARCHAR,
  city VARCHAR,
  state VARCHAR,
  phone_number VARCHAR,
  whatsapp_number VARCHAR,
  email VARCHAR,
  average_rating DECIMAL,
  total_reviews INTEGER,
  image_urls TEXT[],
  availability TEXT,
  experience_years INTEGER,
  distance DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.owner_id,
    s.category_id,
    sc.name as category_name,
    s.title,
    s.description,
    s.price_type,
    s.price,
    s.currency,
    s.location_type,
    s.city,
    s.state,
    s.phone_number,
    s.whatsapp_number,
    s.email,
    s.average_rating,
    s.total_reviews,
    s.image_urls,
    s.availability,
    s.experience_years,
    ROUND(
      6371 * acos(
        cos(radians(user_lat)) * cos(radians(s.latitude)) *
        cos(radians(s.longitude) - radians(user_lon)) +
        sin(radians(user_lat)) * sin(radians(s.latitude))
      )
    )::DECIMAL as distance,
    s.created_at
  FROM services s
  JOIN service_categories sc ON s.category_id = sc.id
  WHERE s.is_active = true
    AND s.latitude IS NOT NULL
    AND s.longitude IS NOT NULL
    AND (search_category IS NULL OR s.category_id = search_category)
    AND (
      search_query IS NULL 
      OR s.title ILIKE '%' || search_query || '%'
      OR s.description ILIKE '%' || search_query || '%'
      OR sc.name ILIKE '%' || search_query || '%'
    )
    AND (
      6371 * acos(
        cos(radians(user_lat)) * cos(radians(s.latitude)) *
        cos(radians(s.longitude) - radians(user_lon)) +
        sin(radians(user_lat)) * sin(radians(s.latitude))
      )
    ) <= search_radius
  ORDER BY distance ASC;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
