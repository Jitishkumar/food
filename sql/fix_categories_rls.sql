-- Fix Row Level Security (RLS) policies for categories table
-- This allows authenticated users to read all categories and insert new ones

-- Enable RLS on categories table (if not already enabled)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access to categories" ON public.categories;
DROP POLICY IF EXISTS "Allow authenticated users to insert categories" ON public.categories;
DROP POLICY IF EXISTS "Allow all users to read categories" ON public.categories;

-- Policy 1: Allow everyone (including anonymous) to read categories
CREATE POLICY "Allow all users to read categories"
ON public.categories
FOR SELECT
USING (true);

-- Policy 2: Allow authenticated users to insert new categories
CREATE POLICY "Allow authenticated users to insert categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Optional: If you want to allow authenticated users to update categories
-- Uncomment the following lines:
-- DROP POLICY IF EXISTS "Allow authenticated users to update categories" ON public.categories;
-- CREATE POLICY "Allow authenticated users to update categories"
-- ON public.categories
-- FOR UPDATE
-- TO authenticated
-- USING (true)
-- WITH CHECK (true);
