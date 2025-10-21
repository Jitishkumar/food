-- Add inventory tracking to food_items table
ALTER TABLE food_items 
ADD COLUMN inventory_count INTEGER DEFAULT NULL,
ADD COLUMN allow_purchase BOOLEAN DEFAULT TRUE;

-- Create notifications table for purchase requests
CREATE TABLE IF NOT EXISTS purchase_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  food_item_id UUID REFERENCES food_items(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  delivery_option TEXT NOT NULL CHECK (delivery_option IN ('pickup', 'delivery')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_business ON purchase_notifications(business_id);
CREATE INDEX IF NOT EXISTS idx_notifications_customer ON purchase_notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_food_item ON purchase_notifications(food_item_id);