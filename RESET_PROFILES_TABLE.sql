-- RESET PROFILES TABLE - Run this in Supabase SQL Editor
-- This will delete and recreate the profiles table with correct RLS policies

-- Step 1: Drop the existing profiles table (this will cascade delete related data)
DROP TABLE IF EXISTS profiles CASCADE;

-- Step 2: Recreate profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('customer', 'owner')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies that allow profile creation on login

-- Allow everyone to view profiles
CREATE POLICY "Anyone can view profiles" 
ON profiles FOR SELECT 
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
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete own profile" 
ON profiles FOR DELETE 
TO authenticated
USING (auth.uid() = id);

-- Step 5: Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as command,
  roles
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd;

SELECT '✅ Profiles table reset successfully! Now try registering and logging in.' as message;
