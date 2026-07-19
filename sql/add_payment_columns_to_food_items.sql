-- Add payment columns to food_items table
-- This allows each food item to have its own payment details

-- Add payment_qr_url column
ALTER TABLE public.food_items 
ADD COLUMN IF NOT EXISTS payment_qr_url TEXT;

-- Add upi_id column
ALTER TABLE public.food_items 
ADD COLUMN IF NOT EXISTS upi_id TEXT;

-- Add comments to document these columns
COMMENT ON COLUMN public.food_items.payment_qr_url IS 'Payment QR code URL for this specific food item (optional, falls back to business payment details)';
COMMENT ON COLUMN public.food_items.upi_id IS 'UPI ID for this specific food item (optional, falls back to business payment details)';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'food_items'
  AND column_name IN ('payment_qr_url', 'upi_id');
