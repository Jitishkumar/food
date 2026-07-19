# Payment Request System Setup Guide

## Overview
This system allows customers to request payments from owners, owners to approve/reject requests, and both parties to receive notifications throughout the process.

## Database Setup

### Step 1: Run SQL Scripts in Supabase SQL Editor

Execute these SQL files in order:

1. **fix_categories_rls.sql** - Fixes category permissions
   - Allows authenticated users to create categories
   - Allows everyone to read categories

2. **add_payment_columns_to_food_items.sql** - Adds payment fields to food_items
   - Adds `payment_qr_url` column
   - Adds `upi_id` column

3. **create_payment_requests_and_notifications.sql** - Creates main tables
   - Creates `payment_requests` table
   - Creates `notifications` table
   - Sets up RLS policies
   - Creates automatic notification triggers

## Features Implemented

### 1. AddFoodItemScreen Updates
- ✅ Category can be typed freely (auto-creates if doesn't exist)
- ✅ Payment QR is now an **image upload** (like food photo)
- ✅ UPI ID can be entered as text
- ✅ Falls back to business payment details if not provided

### 2. PurchaseModal Updates
- ✅ Creates payment request with unique code
- ✅ Stores payment details (QR URL, UPI ID)
- ✅ Automatically notifies owner via database trigger

### 3. NotificationsScreen (NEW)
- ✅ Shows all user notifications
- ✅ Real-time updates via Supabase subscriptions
- ✅ Different views for owners vs customers

#### For Owners:
- See payment requests from customers
- View request details (code, item, amount)
- Approve or reject requests
- Approval triggers notification to customer

#### For Customers:
- See when payment requests are approved/rejected
- **Show QR button** appears on approved requests
- View QR code image for payment
- View UPI ID for payment
- Earn 2 coins after payment 🪙

## Workflow

### Customer Side:
1. Customer searches for food near them
2. Clicks "Buy" on a food item
3. Clicks "Request Payment" in modal
4. Gets unique request code (e.g., REQ-1234567890-ABC123)
5. Owner is notified automatically
6. Customer receives notification when approved
7. Clicks notification to see "Show QR" button
8. Scans QR or uses UPI ID to pay
9. Earns 2 coins! 🪙

### Owner Side:
1. Receives notification: "🛒 New Payment Request"
2. Clicks notification to see details
3. Sees customer request code, item, and amount
4. Clicks "✅ Approve" or "❌ Reject"
5. Customer is notified automatically
6. Customer can now see payment QR and complete payment

## Navigation Setup

You need to add the NotificationsScreen to your navigation:

```javascript
// In your AppNavigator.js or equivalent
import NotificationsScreen from './src/screens/NotificationsScreen';

// Add to your Tab Navigator or Stack Navigator
<Tab.Screen 
  name="Notifications" 
  component={NotificationsScreen}
  options={{
    tabBarIcon: ({ color }) => '🔔',
    tabBarBadge: unreadCount > 0 ? unreadCount : null
  }}
/>
```

## Real-time Notifications

The system uses Supabase Real-time subscriptions:
- Notifications appear instantly when created
- No need to refresh the screen
- Works for both owners and customers

## Database Triggers

The system automatically creates notifications:
1. When payment request is created → Owner gets notified
2. When request is approved → Customer gets notified
3. When request is rejected → Customer gets notified

## Testing

### Test as Customer:
1. Login as a regular user
2. Search for food items
3. Click Buy on any item
4. Request payment
5. Check Notifications tab

### Test as Owner:
1. Login as business owner
2. Check Notifications tab
3. Should see payment request
4. Approve the request
5. Customer will receive notification

## Image Storage Note

Currently, images are stored as `uri` (local paths). For production:
- Upload to Supabase Storage or cloud service (AWS S3, Cloudinary)
- Replace `image.uri` with uploaded URL
- Same for both food images and QR code images

## Next Steps

1. ✅ Run all SQL scripts in Supabase
2. ✅ Add NotificationsScreen to navigation
3. ✅ Test the complete flow
4. 🔄 Implement image upload to cloud storage (production)
5. 🔄 Add push notifications (optional, using Expo Notifications)

## Security Features

- ✅ Row Level Security (RLS) on all tables
- ✅ Users can only see their own notifications
- ✅ Owners can only approve their own payment requests
- ✅ Customers can only create requests for themselves
- ✅ Automatic triggers run with SECURITY DEFINER

## Questions?

If you encounter any errors:
1. Check Supabase logs in Dashboard > Database > Logs
2. Verify RLS policies are enabled
3. Ensure user is authenticated
4. Check console for detailed error messages
