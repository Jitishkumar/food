-- Create payment_requests table
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  food_item_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  business_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, completed
  request_code TEXT NOT NULL, -- unique code for the request
  quantity INTEGER DEFAULT 1,
  total_amount NUMERIC(10, 2),
  customer_phone TEXT,
  customer_notes TEXT,
  owner_notes TEXT,
  payment_qr_url TEXT, -- QR code image URL for payment
  upi_id TEXT, -- UPI ID for payment
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT payment_requests_pkey PRIMARY KEY (id),
  CONSTRAINT payment_requests_food_item_id_fkey FOREIGN KEY (food_item_id) REFERENCES food_items (id) ON DELETE CASCADE,
  CONSTRAINT payment_requests_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT payment_requests_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE,
  CONSTRAINT payment_requests_request_code_key UNIQUE (request_code)
) TABLESPACE pg_default;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_requests_customer ON public.payment_requests USING btree (customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_business ON public.payment_requests USING btree (business_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON public.payment_requests USING btree (status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_code ON public.payment_requests USING btree (request_code);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- payment_request, payment_approved, payment_rejected, etc.
  related_id UUID, -- ID of related record (payment_request, food_item, etc.)
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications USING btree (is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications USING btree (created_at DESC);

-- Enable RLS on payment_requests
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_requests
DROP POLICY IF EXISTS "Users can view their own payment requests" ON public.payment_requests;
CREATE POLICY "Users can view their own payment requests"
ON public.payment_requests
FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Business owners can view their payment requests" ON public.payment_requests;
CREATE POLICY "Business owners can view their payment requests"
ON public.payment_requests
FOR SELECT
TO authenticated
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can create payment requests" ON public.payment_requests;
CREATE POLICY "Users can create payment requests"
ON public.payment_requests
FOR INSERT
TO authenticated
WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "Business owners can update their payment requests" ON public.payment_requests;
CREATE POLICY "Business owners can update their payment requests"
ON public.payment_requests
FOR UPDATE
TO authenticated
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "System can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Function to create notification when payment request is created
CREATE OR REPLACE FUNCTION create_payment_request_notification()
RETURNS TRIGGER AS $$
DECLARE
  owner_user_id UUID;
  food_name TEXT;
BEGIN
  -- Get the business owner's user_id and food name
  SELECT b.owner_id, f.name
  INTO owner_user_id, food_name
  FROM businesses b
  JOIN food_items f ON f.business_id = b.id
  WHERE b.id = NEW.business_id AND f.id = NEW.food_item_id;

  -- Create notification for business owner
  INSERT INTO notifications (user_id, title, message, type, related_id)
  VALUES (
    owner_user_id,
    '🛒 New Payment Request',
    'New payment request for ' || food_name || ' (Code: ' || NEW.request_code || ')',
    'payment_request',
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification when payment request is approved/rejected
CREATE OR REPLACE FUNCTION create_payment_status_notification()
RETURNS TRIGGER AS $$
DECLARE
  food_name TEXT;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Only trigger when status changes to approved or rejected
  IF NEW.status != OLD.status AND (NEW.status = 'approved' OR NEW.status = 'rejected') THEN
    -- Get food name
    SELECT name INTO food_name FROM food_items WHERE id = NEW.food_item_id;

    -- Set notification content based on status
    IF NEW.status = 'approved' THEN
      notification_title := '✅ Payment Request Approved';
      notification_message := 'Your payment request for ' || food_name || ' has been approved! (Code: ' || NEW.request_code || ')';
    ELSE
      notification_title := '❌ Payment Request Rejected';
      notification_message := 'Your payment request for ' || food_name || ' was rejected. (Code: ' || NEW.request_code || ')';
    END IF;

    -- Create notification for customer
    INSERT INTO notifications (user_id, title, message, type, related_id)
    VALUES (
      NEW.customer_id,
      notification_title,
      notification_message,
      'payment_' || NEW.status,
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS payment_request_created_notification ON public.payment_requests;
CREATE TRIGGER payment_request_created_notification
AFTER INSERT ON public.payment_requests
FOR EACH ROW
EXECUTE FUNCTION create_payment_request_notification();

DROP TRIGGER IF EXISTS payment_request_status_notification ON public.payment_requests;
CREATE TRIGGER payment_request_status_notification
AFTER UPDATE ON public.payment_requests
FOR EACH ROW
EXECUTE FUNCTION create_payment_status_notification();

-- Grant permissions
GRANT ALL ON public.payment_requests TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
