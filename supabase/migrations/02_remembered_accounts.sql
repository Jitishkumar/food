-- Create table for remembered accounts
CREATE TABLE IF NOT EXISTS remembered_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_remembered_accounts_device ON remembered_accounts(device_id);
CREATE INDEX IF NOT EXISTS idx_remembered_accounts_user ON remembered_accounts(user_id);

-- Add RLS policies
ALTER TABLE remembered_accounts ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own remembered accounts
CREATE POLICY "Users can view their own remembered accounts"
ON remembered_accounts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to add their own remembered accounts
CREATE POLICY "Users can add their own remembered accounts"
ON remembered_accounts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to remove their own remembered accounts
CREATE POLICY "Users can remove their own remembered accounts"
ON remembered_accounts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);