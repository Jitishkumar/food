-- Complete RLS Fix for Registration
-- This handles the registration flow properly

-- Step 1: Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Step 2: Create new policies with proper permissions

-- Allow everyone to view profiles
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
TO public
USING (true);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
TO authenticated
USING (auth.uid() = id);

-- Step 3: Verify policies are created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd as command,
  qual as using_expression,
  with_check as check_expression
FROM pg_policies 
WHERE tablename = 'profiles';

SELECT 'All policies updated! Try registration now.' as message;
