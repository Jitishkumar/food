-- Sample Data for Food Discover App
-- Run this AFTER running database-schema.sql
-- This adds sample special foods for testing

-- Add sample special/regional foods
INSERT INTO special_foods (name, region, region_type, description, is_featured) VALUES
  ('Hyderabadi Biryani', 'Hyderabad', 'district', 'Famous aromatic rice dish with meat and spices, cooked in dum style', true),
  ('Mysore Pak', 'Karnataka', 'state', 'Traditional sweet made from gram flour, ghee, and sugar', true),
  ('Vada Pav', 'Mumbai', 'district', 'Spicy potato fritter sandwiched in a bun with chutneys', true),
  ('Rasgulla', 'West Bengal', 'state', 'Soft spongy cottage cheese balls soaked in sugar syrup', true),
  ('Chole Bhature', 'Punjab', 'state', 'Spicy chickpea curry with deep-fried bread', false),
  ('Dhokla', 'Gujarat', 'state', 'Steamed savory cake made from fermented rice and chickpea batter', false),
  ('Pani Puri', 'India', 'country', 'Crispy hollow balls filled with spicy tangy water and potatoes', false),
  ('Samosa', 'India', 'country', 'Crispy fried pastry with savory filling of potatoes and peas', false),
  ('Masala Dosa', 'South India', 'country', 'Crispy rice crepe filled with spiced potato filling', false),
  ('Butter Chicken', 'Delhi', 'district', 'Creamy tomato-based curry with tender chicken pieces', false),
  ('Rogan Josh', 'Kashmir', 'state', 'Aromatic lamb curry with Kashmiri spices', false),
  ('Pav Bhaji', 'Mumbai', 'district', 'Spicy mashed vegetable curry served with buttered bread', false),
  ('Jalebi', 'India', 'country', 'Sweet spiral-shaped dessert made from deep-fried batter soaked in sugar syrup', false),
  ('Gulab Jamun', 'India', 'country', 'Deep-fried milk solid balls soaked in rose-flavored sugar syrup', false),
  ('Lassi', 'Punjab', 'state', 'Creamy yogurt-based drink, sweet or salty', false),
  ('Idli Sambhar', 'South India', 'country', 'Steamed rice cakes served with lentil soup', false),
  ('Momos', 'North East India', 'country', 'Steamed dumplings filled with vegetables or meat', false),
  ('Fish Curry', 'Kerala', 'state', 'Spicy coconut-based fish curry with tamarind', false),
  ('Litti Chokha', 'Bihar', 'state', 'Roasted wheat balls served with mashed vegetables', false),
  ('Poha', 'Maharashtra', 'state', 'Flattened rice cooked with onions, spices, and peanuts', false);

-- Link special foods to categories
UPDATE special_foods SET category_id = (SELECT id FROM categories WHERE name = 'Non-Veg' LIMIT 1)
WHERE name IN ('Hyderabadi Biryani', 'Butter Chicken', 'Rogan Josh', 'Fish Curry');

UPDATE special_foods SET category_id = (SELECT id FROM categories WHERE name = 'Sweets' LIMIT 1)
WHERE name IN ('Mysore Pak', 'Rasgulla', 'Jalebi', 'Gulab Jamun');

UPDATE special_foods SET category_id = (SELECT id FROM categories WHERE name = 'Street Food' LIMIT 1)
WHERE name IN ('Vada Pav', 'Pani Puri', 'Samosa', 'Pav Bhaji', 'Momos');

UPDATE special_foods SET category_id = (SELECT id FROM categories WHERE name = 'Veg' LIMIT 1)
WHERE name IN ('Chole Bhature', 'Dhokla', 'Masala Dosa', 'Idli Sambhar', 'Litti Chokha', 'Poha');

UPDATE special_foods SET category_id = (SELECT id FROM categories WHERE name = 'Beverages' LIMIT 1)
WHERE name = 'Lassi';

-- Success message
SELECT 'Sample data inserted successfully! You now have 20 special foods.' as message;
