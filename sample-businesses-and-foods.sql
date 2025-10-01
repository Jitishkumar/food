-- SAMPLE BUSINESSES AND FOODS
-- Run this AFTER creating your first owner account
-- This adds realistic test data for testing the app

-- Note: Replace 'YOUR_OWNER_USER_ID' with actual user ID from profiles table
-- To get your user ID: SELECT id FROM profiles WHERE user_type = 'owner' LIMIT 1;

-- Sample businesses in different locations (adjust coordinates for your area)
-- Example: Bangalore coordinates used here

-- Business 1: Sweet Shop
INSERT INTO businesses (owner_id, business_name, business_type, phone_number, address, latitude, longitude, description, is_active) 
VALUES (
  'YOUR_OWNER_USER_ID',
  'Sharma Sweets & Snacks',
  'Sweet Shop',
  '9876543210',
  'MG Road, Bangalore',
  12.9716,
  77.5946,
  'Famous for traditional Indian sweets and snacks. Family-owned since 1985.',
  true
);

-- Business 2: Dhaba
INSERT INTO businesses (owner_id, business_name, business_type, phone_number, address, latitude, longitude, description, is_active) 
VALUES (
  'YOUR_OWNER_USER_ID',
  'Punjab Dhaba',
  'Dhaba',
  '9988776655',
  'Old Airport Road, Bangalore',
  12.9579,
  77.6410,
  'Authentic Punjabi food. Try our butter chicken and dal makhani!',
  true
);

-- Business 3: Restaurant
INSERT INTO businesses (owner_id, business_name, business_type, phone_number, address, latitude, longitude, description, is_active) 
VALUES (
  'YOUR_OWNER_USER_ID',
  'South Indian Delights',
  'Restaurant',
  '9123456789',
  'Koramangala, Bangalore',
  12.9352,
  77.6245,
  'Best dosa and idli in town. Freshly prepared every morning.',
  true
);

-- Business 4: Cafe
INSERT INTO businesses (owner_id, business_name, business_type, phone_number, address, latitude, longitude, description, is_active) 
VALUES (
  'YOUR_OWNER_USER_ID',
  'Coffee House Cafe',
  'Cafe',
  '9876501234',
  'Indiranagar, Bangalore',
  12.9784,
  77.6408,
  'Cozy cafe with great coffee and snacks. Free WiFi available.',
  true
);

-- Business 5: Street Food Stall
INSERT INTO businesses (owner_id, business_name, business_type, phone_number, address, latitude, longitude, description, is_active) 
VALUES (
  'YOUR_OWNER_USER_ID',
  'Chaat Corner',
  'Street Food Stall',
  '9988001122',
  'Brigade Road, Bangalore',
  12.9698,
  77.6025,
  'Popular street food stall. Famous for pani puri and vada pav.',
  true
);

-- Now let's add food items for each business
-- First, get the business IDs (we'll use subqueries)

-- Food items for Sharma Sweets & Snacks
INSERT INTO food_items (business_id, name, description, category_id, price, is_available) 
VALUES (
  (SELECT id FROM businesses WHERE business_name = 'Sharma Sweets & Snacks' LIMIT 1),
  'Mysore Pak',
  'Traditional gram flour sweet made with pure ghee',
  (SELECT id FROM categories WHERE name = 'Sweets' LIMIT 1),
  150.00,
  true
);

INSERT INTO food_items (business_id, name, description, category_id, price, is_available) 
VALUES (
  (SELECT id FROM businesses WHERE business_name = 'Sharma Sweets & Snacks' LIMIT 1),
  'Gulab Jamun',
  'Soft milk solid balls soaked in rose syrup',
  (SELECT id FROM categories WHERE name = 'Sweets' LIMIT 1),
  80.00,
  true
);

INSERT INTO food_items (business_id, name, description, category_id, price, is_available) 
VALUES (
  (SELECT id FROM businesses WHERE business_name = 'Sharma Sweets & Snacks' LIMIT 1),
  'Jalebi',
  'Crispy sweet spirals soaked in sugar syrup',
  (SELECT id FROM categories WHERE name = 'Sweets' LIMIT 1),
  60.00,
  true
);

INSERT INTO food_items (business_id, name, description, category_id, price, is_available) 
VALUES (
  (SELECT id FROM businesses WHERE business_name = 'Sharma Sweets & Snacks' LIMIT 1),
  'Samosa',
  'Crispy fried pastry filled with spiced potatoes',
  (SELECT id FROM categories WHERE name = 'Street Food' LIMIT 1),
  30.00,
  true
);

-- Food items for Punjab Dhaba
INSERT INTO food_items (business_id, name, description, category_id, price, is_available) 
VALUES (
  (SELECT id FROM businesses WHERE business_name = 'Punjab Dhaba' LIMIT 1),
  'Butter Chicken',
  'Tender chicken in creamy tomato gravy',
  (SELECT id FROM categories WHERE name = 'Non-Veg' LIMIT 1),
  280.00,
  true
);

INSERT INTO food_items (business_id, name, description, category_id, price, is_available) 
VALUES (
  (SELECT id FROM businesses WHERE business_name = 'Punjab Dhaba' LIMIT 1),
  'Dal Makhani',
  'Creamy black lentils cooked overnight',
  (SELECT id FROM categories WHERE name = 'Veg' LIMIT 1),
  180.00,
  true
);

INSERT INTO food_items (business_id, name, description, category_id, price, is_available) 
VALUES (
  (SELECT id FROM businesses WHERE business_name = 'Punjab Dhaba' LIMIT 1),
  'Chicken Biryani',
  'Aromatic basmati rice with tender chicken',
  (SELECT id FROM categories WHERE name = 'Non-Veg' LIMIT 1),
  250.00,
  true
);

INSERT INTO food_items (business_id, name, description, category_id, price, is_available) 
VALUES (
  (SELECT id FROM businesses WHERE business_name = 'Punjab Dhaba' LIMIT 1),
  'Tandoori Roti',
  'Whole wheat flatbread from clay oven',
  (SELECT id FROM categories WHERE name = 'Veg' LIMIT 1),
  20.00,
  true
);

INSERT INTO food_items (business_id, name, description, category_id, price, is_available) 
VALUES (
  (SELECT id FROM businesses WHERE business_name = 'Punjab Dhaba' LIMIT 1),
  'Lassi',
  'Refreshing yogurt drink - sweet or salted',
  (SELECT id FROM categories WHERE name = 'Beverages' LIMIT 1),
  60.00,
  true
);

-- Food items for South Indian Delights
INSERT INTO food_items (business_id, name, description, category_id, price, is_available) 
VALUES (
  (SELECT id FROM businesses WHERE business_name = 'South Indian Delights' LIMIT 1),
  'Masala Dosa',
  'Crispy rice crepe with spiced potato filling',
  (SELECT id FROM categories WHERE name = 'Veg' LIMIT 1),
  80.00,
  true
);

INSERT INTO food_items (business_id, name, description, category_id, price, is_available) 
VALUES (
  (SELECT id FROM businesses WHERE business_name = 'South Indian Delights' LIMIT 1),
  'Idli Sambhar',
  'Steamed rice cakes with lentil soup',
  (SELECT id FROM categories WHERE name = 'Veg' LIMIT 1),
  60.00,
  true
);

INSERT INTO food_items (business_id, name, description, category_id, price, is_available) 
VALUES (
  (SELECT id FROM businesses WHERE business_name = 'South Indian Delights' LIMIT 1),
  'Vada',
  'Crispy fried lentil donuts',
  (SELECT id FROM categories WHERE name = 'Veg' LIMIT 1),
  40.00,
  true
);

INSERT INTO food_items (business_id, name, description, category_id, price, is_available) 
VALUES (
  (SELECT id FROM businesses WHERE business_name = 'South Indian Delights' LIMIT 1),
  'Filter Coffee',
  'Traditional South Indian coffee',
  (SELECT id FROM categories WHERE name = 'Beverages' LIMIT 1),
  40.00,
  true
);

-- Food items for Coffee House Cafe
INSERT INTO food_items (business_id, name, description, category_id, price, is_available) 
VALUES (
  (SELECT id FROM businesses WHERE business_name = 'Coffee House Cafe' LIMIT 1),
  'Cappuccino',
  'Espresso with steamed milk foam',
  (SELECT id FROM categories WHERE name = 'Beverages' LIMIT 1),
  120.00,
  true
);

INSERT INTO food_items (business_id, name, description, category_id, price, is_available) 
VALUES (
  (SELECT id FROM businesses WHERE business_name = 'Coffee House Cafe' LIMIT 1),
  'Chocolate Cake',
  'Rich chocolate cake with chocolate frosting',
  (SELECT id FROM categories WHERE name = 'Desserts' LIMIT 1),
  150.00,
  true
);

INSERT INTO food_items (business_id, name, description, category_id, price, is_available) 
VALUES (
  (SELECT id FROM businesses WHERE business_name = 'Coffee House Cafe' LIMIT 1),
  'Sandwich',
  'Grilled vegetable sandwich',
  (SELECT id FROM categories WHERE name = 'Fast Food' LIMIT 1),
  100.00,
  true
);

INSERT INTO food_items (business_id, name, description, category_id, price, is_available) 
VALUES (
  (SELECT id FROM businesses WHERE business_name = 'Coffee House Cafe' LIMIT 1),
  'Muffin',
  'Freshly baked blueberry muffin',
  (SELECT id FROM categories WHERE name = 'Bakery' LIMIT 1),
  80.00,
  true
);

-- Food items for Chaat Corner
INSERT INTO food_items (business_id, name, description, category_id, price, is_available) 
VALUES (
  (SELECT id FROM businesses WHERE business_name = 'Chaat Corner' LIMIT 1),
  'Pani Puri',
  'Crispy balls with spicy tangy water',
  (SELECT id FROM categories WHERE name = 'Street Food' LIMIT 1),
  40.00,
  true
);

INSERT INTO food_items (business_id, name, description, category_id, price, is_available) 
VALUES (
  (SELECT id FROM businesses WHERE business_name = 'Chaat Corner' LIMIT 1),
  'Vada Pav',
  'Spicy potato fritter in a bun',
  (SELECT id FROM categories WHERE name = 'Street Food' LIMIT 1),
  30.00,
  true
);

INSERT INTO food_items (business_id, name, description, category_id, price, is_available) 
VALUES (
  (SELECT id FROM businesses WHERE business_name = 'Chaat Corner' LIMIT 1),
  'Bhel Puri',
  'Puffed rice mixed with veggies and chutneys',
  (SELECT id FROM categories WHERE name = 'Street Food' LIMIT 1),
  50.00,
  true
);

INSERT INTO food_items (business_id, name, description, category_id, price, is_available) 
VALUES (
  (SELECT id FROM businesses WHERE business_name = 'Chaat Corner' LIMIT 1),
  'Pav Bhaji',
  'Spiced vegetable curry with buttered buns',
  (SELECT id FROM categories WHERE name = 'Street Food' LIMIT 1),
  80.00,
  true
);

-- Success message
SELECT 
  'Sample data inserted successfully!' as message,
  COUNT(DISTINCT b.id) as total_businesses,
  COUNT(DISTINCT f.id) as total_food_items
FROM businesses b
LEFT JOIN food_items f ON b.id = f.business_id;

-- Show what was created
SELECT 
  b.business_name,
  b.business_type,
  COUNT(f.id) as food_items_count
FROM businesses b
LEFT JOIN food_items f ON b.id = f.business_id
GROUP BY b.id, b.business_name, b.business_type
ORDER BY b.business_name;
