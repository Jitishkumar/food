-- Fix Registration Error
-- Run this in Supabase SQL Editor to allow user registration

-- Add the missing INSERT policy for profiles table
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Verify the policy was created
SELECT 'Registration policy added successfully!' as message;
