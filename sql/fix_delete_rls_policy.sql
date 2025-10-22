-- ============================================
-- FIX: Add DELETE policy for businesses table
-- This allows owners to delete their own businesses
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- Add DELETE policy for businesses
CREATE POLICY "Owners can delete own businesses"
ON public.businesses
FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'businesses'
ORDER BY cmd;
