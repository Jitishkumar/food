# 🚀 Quick Start Guide

## ✅ Your Supabase is Already Configured!

Your credentials are already set up in `supabase-config.js`:
- **URL**: https://sikuvuepkmuoxvrwvjyo.supabase.co
- **Status**: ✅ Ready to use

---

## 📝 Step 1: Run Database Schema (IMPORTANT!)

1. Open your Supabase project: https://supabase.com/dashboard/project/sikuvuepkmuoxvrwvjyo

2. Go to **SQL Editor** (left sidebar)

3. Copy the **ENTIRE** contents of `database-schema.sql`

4. Paste into the SQL Editor

5. Click **"RUN"** button

6. You should see: **"Success. No rows returned"**

✅ This creates all tables, functions, and security policies!

---

## 🏃 Step 2: Start the App

```bash
cd /Users/jitishkumar/Desktop/food-discover
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator  
- Scan QR code with Expo Go app on your phone

---

## 👤 Step 3: Create Your First Account

1. **Register as Customer**:
   - Click "Sign Up"
   - Select "🍴 Customer"
   - Fill in details
   - Login

2. **Register as Restaurant Owner**:
   - Click "Sign Up"
   - Select "🏪 Restaurant Owner"
   - Fill in details
   - Login

---

## 🧪 Step 4: Test the Features

### As Customer:
1. ✅ Allow location permissions
2. 🔍 Search for food nearby (select range: 5km, 10km, etc.)
3. ⭐ Browse "Special Foods"
4. 📱 Click on a business to see details
5. 📞 Test "Call" and "Directions" buttons

### As Restaurant Owner:
1. ➕ Add a new business
2. 📍 Location will auto-detect
3. 🍕 Add food items to your business
4. 📊 View your dashboard stats

---

## 🎯 Adding Sample Data

### Add Special Foods (Admin - via SQL Editor):

```sql
-- Add some special foods for testing
INSERT INTO special_foods (name, region, region_type, description, is_featured) VALUES
  ('Hyderabadi Biryani', 'Hyderabad', 'district', 'Famous aromatic rice dish with meat', true),
  ('Mysore Pak', 'Karnataka', 'state', 'Traditional sweet made from gram flour and ghee', true),
  ('Vada Pav', 'Mumbai', 'district', 'Spicy potato fritter in a bun', false),
  ('Rasgulla', 'West Bengal', 'state', 'Soft spongy cottage cheese balls in syrup', false),
  ('Samosa', 'India', 'country', 'Crispy fried pastry with savory filling', false);
```

---

## 🐛 Troubleshooting

### Database Error?
- Make sure you ran the **entire** `database-schema.sql` file
- Check for any error messages in SQL Editor
- The schema should create 7 tables

### Location Not Working?
- Allow location permissions when prompted
- Enable location services on your device
- Try the "🔄 Refresh Location" button

### App Won't Start?
```bash
# Clear cache
npm start -- --clear

# Or reinstall
rm -rf node_modules
npm install
npm start
```

### Can't Login After Registration?
- Check Supabase dashboard → Authentication → Users
- Your user should appear there
- Check email confirmation settings (disable for testing)

---

## 📱 Testing on Real Device (Recommended)

1. Install **Expo Go** app:
   - iOS: App Store
   - Android: Play Store

2. Run `npm start`

3. Scan QR code with:
   - iOS: Camera app
   - Android: Expo Go app

4. App will load on your phone

**Why real device?**
- Test actual GPS location
- Test phone calling
- Test Google Maps integration
- Better performance

---

## 🎨 Customize Your App

### Change App Colors:
Edit the primary color `#FF6B35` in any screen file to your brand color.

### Add More Categories:
```sql
INSERT INTO categories (name, icon) VALUES 
  ('Pizza', '🍕'),
  ('Chinese', '🥡'),
  ('South Indian', '🍛');
```

### Change App Name:
Edit `app.json` → `expo.name`

---

## 📊 Monitor Your App

### Supabase Dashboard:
- **Table Editor**: View all data
- **Authentication**: See registered users
- **SQL Editor**: Run queries
- **Logs**: Debug issues

### Check Tables:
1. `profiles` - All users
2. `businesses` - Restaurant listings
3. `food_items` - Food posts
4. `reviews` - User reviews
5. `special_foods` - Regional specialties

---

## 🚀 Next Steps

1. ✅ Test all features thoroughly
2. 📸 Add real food photos
3. 🗺️ Test with multiple locations
4. 👥 Get friends to test
5. 📈 Track user feedback
6. 💰 Plan monetization strategy

---

## 💡 Pro Tips

- **Test with 2 accounts**: One customer, one owner
- **Use real locations**: Add actual restaurants in your area
- **Get feedback early**: Show to potential users
- **Track metrics**: User signups, searches, reviews
- **Iterate fast**: Add features based on feedback

---

## 🎉 You're Ready!

Your Food Discover app is fully functional and ready to test!

**What makes this special:**
- ✅ Real-time location search
- ✅ Direct phone calling
- ✅ Google Maps integration
- ✅ Reviews & ratings
- ✅ Regional food discovery
- ✅ Separate flows for customers & owners

**Start testing and good luck with your startup! 🚀**
