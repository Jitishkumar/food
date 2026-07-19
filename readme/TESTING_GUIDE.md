# Payment Request System - Testing Guide

## ✅ Setup Complete!

You've completed:
1. ✅ Database setup (SQL scripts executed)
2. ✅ Navigation setup (NotificationsScreen added)

## Navigation Structure

### For Customers:
- **Bottom Tabs**: Home | Nearby | **🔔 Notifications** | More
- Notifications accessible via bottom tab bar

### For Owners:
- **Owner Dashboard** → Bell icon (🔔) in top-right header
- Click bell icon to access notifications

## Testing the Complete Flow

### Test as Customer:

1. **Login as customer** (regular user account)

2. **Search for food near you:**
   - Go to Home tab
   - Set search range (e.g., 20 km)
   - Click "🔍 Search Nearby"

3. **Request payment:**
   - Click "🛒 Buy" on any food item
   - Click "💳 Request Payment" in the modal
   - You'll get a unique code (e.g., REQ-1234567890-ABC123)
   - Alert shows: "Request Sent! 🎉"

4. **Check notifications:**
   - Click the **🔔 Notifications** tab in bottom bar
   - Wait for owner to approve (refresh if needed)

5. **When approved:**
   - Click the notification
   - See "✅ Payment Approved!" screen
   - View QR code image
   - View UPI ID
   - Complete payment using QR or UPI

### Test as Owner:

1. **Login as business owner**

2. **Check notifications:**
   - Click the **🔔 bell icon** in top-right corner of Owner Dashboard
   - You should see "🛒 New Payment Request" notifications

3. **View request details:**
   - Click on a payment request notification
   - See:
     - Request code
     - Food item name
     - Amount
   - Choose: **✅ Approve** or **❌ Reject**

4. **Approve request:**
   - Click "✅ Approve"
   - Customer gets notified immediately
   - Customer can now see payment QR and complete payment

## Features to Test

### ✅ Category System:
- In AddFoodItemScreen, type any category name
- If category exists → uses existing
- If category is new → creates automatically
- Try: "Drinks", "desserts", "DRINKS" (case-insensitive)

### ✅ Payment QR Upload:
- In AddFoodItemScreen, scroll to "Payment Details"
- Click "📷 Add Payment QR Image"
- Select QR code image from gallery
- Add UPI ID text
- These show to customer when payment is approved

### ✅ Real-time Notifications:
- Keep notifications screen open
- Have someone make a payment request
- Notification appears instantly (no refresh needed)

### ✅ Notification Types:
- 🛒 Payment Request (owner receives)
- ✅ Payment Approved (customer receives)
- ❌ Payment Rejected (customer receives)

## Common Scenarios

### Scenario 1: Happy Path
```
Customer → Request Payment → Owner → Approve → Customer → See QR → Pay → Earn 2 coins 🪙
```

### Scenario 2: Rejection
```
Customer → Request Payment → Owner → Reject → Customer → Gets rejection notification
```

### Scenario 3: Multiple Requests
```
Multiple customers → Multiple requests → Owner sees list → Approve/reject individually
```

## Troubleshooting

### "No notifications yet"
- Make sure you completed Step 1 (SQL scripts)
- Check Supabase logs for errors
- Verify user is authenticated

### "Could not find the 'payment_requests' table"
- Run `create_payment_requests_and_notifications.sql` again
- Check Supabase Dashboard → Database → Tables

### Images not showing
- Currently using local URIs (image.uri)
- For production, implement cloud storage upload
- Images work on same device for testing

### Notification not appearing instantly
- Check internet connection
- Supabase real-time must be enabled
- Try pull-to-refresh on notifications screen

## Next Steps (Optional Enhancements)

1. **Image Upload to Cloud:**
   - Implement Supabase Storage
   - Upload food images and QR codes
   - Replace local URIs with cloud URLs

2. **Push Notifications:**
   - Add Expo Notifications
   - Send push when payment request arrives
   - Send push when request is approved/rejected

3. **Payment Confirmation:**
   - Add "Mark as Paid" button for customer
   - Track payment completion
   - Award coins automatically

4. **Unread Badge:**
   - Show unread count on notification icon
   - Update in real-time
   - Clear when viewed

## Database Schema Quick Reference

### payment_requests
- `id` - UUID primary key
- `food_item_id` - Reference to food item
- `customer_id` - Customer who made request
- `business_id` - Business receiving request
- `status` - pending, approved, rejected
- `request_code` - Unique code (REQ-...)
- `payment_qr_url` - QR code image URL
- `upi_id` - UPI payment ID

### notifications
- `id` - UUID primary key
- `user_id` - Recipient user
- `title` - Notification title
- `message` - Notification message
- `type` - payment_request, payment_approved, etc.
- `related_id` - Related payment_request ID
- `is_read` - Read status

## Support

If you encounter issues:
1. Check Supabase logs (Dashboard → Database → Logs)
2. Check browser/mobile console for errors
3. Verify RLS policies are active
4. Test with simple cases first

Happy testing! 🎉
