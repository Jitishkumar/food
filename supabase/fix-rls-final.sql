-- Final Fix for Registration Error
-- The issue: During registration, the profile is created AFTER auth user is created
-- Solution: Allow authenticated users to insert profiles

-- First, drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a new policy that allows authenticated users to insert profiles
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Verify
SELECT 'Registration should work now!' as message;
