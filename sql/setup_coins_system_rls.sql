-- Setup Row Level Security for Coins System
-- This allows users to view and update their own coin balances
-- Note: profiles.id = auth.users.id (same value)

-- Enable RLS on user_coins
ALTER TABLE public.user_coins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own coins" ON public.user_coins;
DROP POLICY IF EXISTS "Users can insert their own coins record" ON public.user_coins;
DROP POLICY IF EXISTS "Users can update their own coins" ON public.user_coins;

-- Policy 1: Users can view their own coins
CREATE POLICY "Users can view their own coins"
ON public.user_coins
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 2: Users can insert their own coins record
CREATE POLICY "Users can insert their own coins record"
ON public.user_coins
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy 3: Users can update their own coins
CREATE POLICY "Users can update their own coins"
ON public.user_coins
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Enable RLS on coin_transactions
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.coin_transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.coin_transactions;

-- Policy 1: Users can view their own transactions
CREATE POLICY "Users can view their own transactions"
ON public.coin_transactions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 2: Users can insert their own transactions
CREATE POLICY "Users can insert their own transactions"
ON public.coin_transactions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Grant permissions
GRANT ALL ON public.user_coins TO authenticated;
GRANT ALL ON public.coin_transactions TO authenticated;

-- Also grant usage on sequences if they exist
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('user_coins', 'coin_transactions')
ORDER BY tablename, policyname;
