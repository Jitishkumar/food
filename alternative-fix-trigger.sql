-- Alternative Fix: Use Database Trigger for Auto Profile Creation
-- This creates the profile automatically when a user signs up

-- Step 1: Create a function that creates a profile automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert a basic profile for the new user
  -- The app will update it with full details later
  INSERT INTO public.profiles (id, email, full_name, phone_number, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create a trigger that runs after user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Update RLS to allow the trigger to work
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Enable insert for authenticated users" 
ON profiles FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Step 4: Keep other policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
TO authenticated
USING (auth.uid() = id);

SELECT 'Trigger-based profile creation enabled!' as message;
