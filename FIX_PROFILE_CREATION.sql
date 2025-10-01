-- DEFINITIVE FIX FOR PROFILE CREATION ISSUE
-- This will allow authenticated users to create their profile during registration

-- Step 1: Drop the existing INSERT policy that's blocking registration
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Step 2: Create a new policy that allows authenticated users to insert
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Step 3: Verify the policy was created correctly
SELECT 
  policyname, 
  cmd as command,
  roles,
  qual as using_expression,
  with_check as check_expression
FROM pg_policies 
WHERE tablename = 'profiles' AND cmd = 'INSERT';

-- You should see:
-- policyname: "Users can insert own profile"
-- command: INSERT
-- roles: {authenticated}
-- check_expression: (auth.uid() = id)

SELECT '✅ Profile creation policy fixed! Try registering again.' as message;
