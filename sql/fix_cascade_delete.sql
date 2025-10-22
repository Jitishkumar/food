-- ============================================
-- FIX: Ensure CASCADE DELETE for related tables
-- This ensures when a business is deleted, all related data is also deleted
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- First, drop existing foreign key constraints
ALTER TABLE food_items 
DROP CONSTRAINT IF EXISTS food_items_business_id_fkey;

ALTER TABLE food_item_reviews 
DROP CONSTRAINT IF EXISTS food_item_reviews_food_item_id_fkey;

ALTER TABLE food_item_reports 
DROP CONSTRAINT IF EXISTS food_item_reports_food_item_id_fkey;

-- Re-add foreign key constraints with CASCADE DELETE
-- This ensures when a business is deleted, all food items are also deleted
ALTER TABLE food_items
ADD CONSTRAINT food_items_business_id_fkey 
FOREIGN KEY (business_id) 
REFERENCES businesses(id) 
ON DELETE CASCADE;

-- This ensures when a food item is deleted, all reviews are also deleted
ALTER TABLE food_item_reviews
ADD CONSTRAINT food_item_reviews_food_item_id_fkey 
FOREIGN KEY (food_item_id) 
REFERENCES food_items(id) 
ON DELETE CASCADE;

-- This ensures when a food item is deleted, all reports are also deleted
ALTER TABLE food_item_reports
ADD CONSTRAINT food_item_reports_food_item_id_fkey 
FOREIGN KEY (food_item_id) 
REFERENCES food_items(id) 
ON DELETE CASCADE;

-- Add DELETE policy for food_items (if not exists)
DROP POLICY IF EXISTS "Owners can delete own food items" ON food_items;
CREATE POLICY "Owners can delete own food items"
ON food_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM businesses 
    WHERE businesses.id = food_items.business_id 
    AND businesses.owner_id = auth.uid()
  )
);

-- Add DELETE policy for food_item_reviews (if not exists)
DROP POLICY IF EXISTS "Users can delete own reviews" ON food_item_reviews;
CREATE POLICY "Users can delete own reviews"
ON food_item_reviews
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add DELETE policy for food_item_reports (if not exists)
DROP POLICY IF EXISTS "Users can delete own reports" ON food_item_reports;
CREATE POLICY "Users can delete own reports"
ON food_item_reports
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Verify all constraints
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
LEFT JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name IN ('businesses', 'food_items', 'food_item_reviews', 'food_item_reports')
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, tc.constraint_name;
