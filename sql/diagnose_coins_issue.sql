-- Diagnostic queries to troubleshoot coins RLS issue
-- Run these one by one to identify the problem

-- 1. Check if current user exists in profiles table
SELECT 
  auth.uid() as current_user_id,
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()) as profile_exists;

-- 2. Check user_coins table structure and policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'user_coins'
ORDER BY policyname;

-- 3. Check coin_transactions table policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'coin_transactions'
ORDER BY policyname;

-- 4. Check if user has any coins record
SELECT * FROM user_coins WHERE user_id = auth.uid();

-- 5. Test if user can insert into user_coins (should return success)
-- Uncomment and run only if you want to test:
-- INSERT INTO user_coins (user_id, balance, earned_total, spent_total)
-- VALUES (auth.uid(), 0, 0, 0)
-- ON CONFLICT (user_id) DO NOTHING
-- RETURNING *;

-- 6. Test if user can insert into coin_transactions (should return success)
-- Uncomment and run only if you want to test:
-- INSERT INTO coin_transactions (user_id, amount, type, source, description)
-- VALUES (auth.uid(), 2, 'earned', 'purchase', 'Test transaction')
-- RETURNING *;

-- 7. Check table ownership and grants
SELECT 
  grantee, 
  table_schema, 
  table_name, 
  privilege_type
FROM information_schema.table_privileges
WHERE table_name IN ('user_coins', 'coin_transactions')
  AND grantee = 'authenticated'
ORDER BY table_name, privilege_type;
