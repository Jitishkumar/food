-- EASY SAMPLE DATA - Run this after you have at least one owner account
-- This will automatically use the first owner account it finds

DO $$
DECLARE
  v_owner_id UUID;
  v_business_1 UUID;
  v_business_2 UUID;
  v_business_3 UUID;
  v_business_4 UUID;
  v_business_5 UUID;
BEGIN
  -- Get the first owner user ID
  SELECT id INTO v_owner_id FROM profiles WHERE user_type = 'owner' LIMIT 1;
  
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'No owner account found. Please create an owner account first.';
  END IF;

  -- Insert Business 1: Sweet Shop
  INSERT INTO businesses (owner_id, business_name, business_type, phone_number, address, latitude, longitude, description, is_active) 
  VALUES (
    v_owner_id,
    'Sharma Sweets & Snacks',
    'Sweet Shop',
    '9876543210',
    'MG Road, Bangalore',
    12.9716,
    77.5946,
    'Famous for traditional Indian sweets and snacks. Family-owned since 1985.',
    true
  ) RETURNING id INTO v_business_1;

  -- Insert Business 2: Dhaba
  INSERT INTO businesses (owner_id, business_name, business_type, phone_number, address, latitude, longitude, description, is_active) 
  VALUES (
    v_owner_id,
    'Punjab Dhaba',
    'Dhaba',
    '9988776655',
    'Old Airport Road, Bangalore',
    12.9579,
    77.6410,
    'Authentic Punjabi food. Try our butter chicken and dal makhani!',
    true
  ) RETURNING id INTO v_business_2;

  -- Insert Business 3: Restaurant
  INSERT INTO businesses (owner_id, business_name, business_type, phone_number, address, latitude, longitude, description, is_active) 
  VALUES (
    v_owner_id,
    'South Indian Delights',
    'Restaurant',
    '9123456789',
    'Koramangala, Bangalore',
    12.9352,
    77.6245,
    'Best dosa and idli in town. Freshly prepared every morning.',
    true
  ) RETURNING id INTO v_business_3;

  -- Insert Business 4: Cafe
  INSERT INTO businesses (owner_id, business_name, business_type, phone_number, address, latitude, longitude, description, is_active) 
  VALUES (
    v_owner_id,
    'Coffee House Cafe',
    'Cafe',
    '9876501234',
    'Indiranagar, Bangalore',
    12.9784,
    77.6408,
    'Cozy cafe with great coffee and snacks. Free WiFi available.',
    true
  ) RETURNING id INTO v_business_4;

  -- Insert Business 5: Street Food Stall
  INSERT INTO businesses (owner_id, business_name, business_type, phone_number, address, latitude, longitude, description, is_active) 
  VALUES (
    v_owner_id,
    'Chaat Corner',
    'Street Food Stall',
    '9988001122',
    'Brigade Road, Bangalore',
    12.9698,
    77.6025,
    'Popular street food stall. Famous for pani puri and vada pav.',
    true
  ) RETURNING id INTO v_business_5;

  -- Food items for Sharma Sweets & Snacks (Business 1)
  INSERT INTO food_items (business_id, name, description, category_id, price, is_available) VALUES
    (v_business_1, 'Mysore Pak', 'Traditional gram flour sweet made with pure ghee', (SELECT id FROM categories WHERE name = 'Sweets' LIMIT 1), 150.00, true),
    (v_business_1, 'Gulab Jamun', 'Soft milk solid balls soaked in rose syrup', (SELECT id FROM categories WHERE name = 'Sweets' LIMIT 1), 80.00, true),
    (v_business_1, 'Jalebi', 'Crispy sweet spirals soaked in sugar syrup', (SELECT id FROM categories WHERE name = 'Sweets' LIMIT 1), 60.00, true),
    (v_business_1, 'Rasgulla', 'Spongy cottage cheese balls in sugar syrup', (SELECT id FROM categories WHERE name = 'Sweets' LIMIT 1), 90.00, true),
    (v_business_1, 'Samosa', 'Crispy fried pastry filled with spiced potatoes', (SELECT id FROM categories WHERE name = 'Street Food' LIMIT 1), 30.00, true);

  -- Food items for Punjab Dhaba (Business 2)
  INSERT INTO food_items (business_id, name, description, category_id, price, is_available) VALUES
    (v_business_2, 'Butter Chicken', 'Tender chicken in creamy tomato gravy', (SELECT id FROM categories WHERE name = 'Non-Veg' LIMIT 1), 280.00, true),
    (v_business_2, 'Dal Makhani', 'Creamy black lentils cooked overnight', (SELECT id FROM categories WHERE name = 'Veg' LIMIT 1), 180.00, true),
    (v_business_2, 'Chicken Biryani', 'Aromatic basmati rice with tender chicken', (SELECT id FROM categories WHERE name = 'Non-Veg' LIMIT 1), 250.00, true),
    (v_business_2, 'Tandoori Roti', 'Whole wheat flatbread from clay oven', (SELECT id FROM categories WHERE name = 'Veg' LIMIT 1), 20.00, true),
    (v_business_2, 'Lassi', 'Refreshing yogurt drink - sweet or salted', (SELECT id FROM categories WHERE name = 'Beverages' LIMIT 1), 60.00, true),
    (v_business_2, 'Paneer Tikka', 'Grilled cottage cheese with spices', (SELECT id FROM categories WHERE name = 'Veg' LIMIT 1), 200.00, true);

  -- Food items for South Indian Delights (Business 3)
  INSERT INTO food_items (business_id, name, description, category_id, price, is_available) VALUES
    (v_business_3, 'Masala Dosa', 'Crispy rice crepe with spiced potato filling', (SELECT id FROM categories WHERE name = 'Veg' LIMIT 1), 80.00, true),
    (v_business_3, 'Idli Sambhar', 'Steamed rice cakes with lentil soup', (SELECT id FROM categories WHERE name = 'Veg' LIMIT 1), 60.00, true),
    (v_business_3, 'Medu Vada', 'Crispy fried lentil donuts', (SELECT id FROM categories WHERE name = 'Veg' LIMIT 1), 40.00, true),
    (v_business_3, 'Filter Coffee', 'Traditional South Indian coffee', (SELECT id FROM categories WHERE name = 'Beverages' LIMIT 1), 40.00, true),
    (v_business_3, 'Uttapam', 'Thick rice pancake with vegetables', (SELECT id FROM categories WHERE name = 'Veg' LIMIT 1), 70.00, true);

  -- Food items for Coffee House Cafe (Business 4)
  INSERT INTO food_items (business_id, name, description, category_id, price, is_available) VALUES
    (v_business_4, 'Cappuccino', 'Espresso with steamed milk foam', (SELECT id FROM categories WHERE name = 'Beverages' LIMIT 1), 120.00, true),
    (v_business_4, 'Latte', 'Espresso with steamed milk', (SELECT id FROM categories WHERE name = 'Beverages' LIMIT 1), 130.00, true),
    (v_business_4, 'Chocolate Cake', 'Rich chocolate cake with chocolate frosting', (SELECT id FROM categories WHERE name = 'Desserts' LIMIT 1), 150.00, true),
    (v_business_4, 'Sandwich', 'Grilled vegetable sandwich', (SELECT id FROM categories WHERE name = 'Fast Food' LIMIT 1), 100.00, true),
    (v_business_4, 'Blueberry Muffin', 'Freshly baked blueberry muffin', (SELECT id FROM categories WHERE name = 'Bakery' LIMIT 1), 80.00, true),
    (v_business_4, 'Croissant', 'Buttery flaky pastry', (SELECT id FROM categories WHERE name = 'Bakery' LIMIT 1), 90.00, true);

  -- Food items for Chaat Corner (Business 5)
  INSERT INTO food_items (business_id, name, description, category_id, price, is_available) VALUES
    (v_business_5, 'Pani Puri', 'Crispy balls with spicy tangy water', (SELECT id FROM categories WHERE name = 'Street Food' LIMIT 1), 40.00, true),
    (v_business_5, 'Vada Pav', 'Spicy potato fritter in a bun', (SELECT id FROM categories WHERE name = 'Street Food' LIMIT 1), 30.00, true),
    (v_business_5, 'Bhel Puri', 'Puffed rice mixed with veggies and chutneys', (SELECT id FROM categories WHERE name = 'Street Food' LIMIT 1), 50.00, true),
    (v_business_5, 'Pav Bhaji', 'Spiced vegetable curry with buttered buns', (SELECT id FROM categories WHERE name = 'Street Food' LIMIT 1), 80.00, true),
    (v_business_5, 'Sev Puri', 'Crispy crackers with toppings', (SELECT id FROM categories WHERE name = 'Street Food' LIMIT 1), 45.00, true),
    (v_business_5, 'Dahi Puri', 'Puri filled with yogurt and chutneys', (SELECT id FROM categories WHERE name = 'Street Food' LIMIT 1), 50.00, true);

  RAISE NOTICE '✅ Sample data created successfully!';
  RAISE NOTICE 'Created 5 businesses with 30 food items';
  RAISE NOTICE 'Owner: %', v_owner_id;
END $$;

-- Show summary
SELECT 
  '🎉 Sample Data Created!' as status,
  COUNT(DISTINCT b.id) as businesses,
  COUNT(f.id) as food_items
FROM businesses b
LEFT JOIN food_items f ON b.id = f.business_id;

-- Show details
SELECT 
  b.business_name,
  b.business_type,
  b.phone_number,
  COUNT(f.id) as items
FROM businesses b
LEFT JOIN food_items f ON b.id = f.business_id
GROUP BY b.id, b.business_name, b.business_type, b.phone_number
ORDER BY b.business_name;
