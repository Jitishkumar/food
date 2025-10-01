# 📊 How to Add Sample Data

## 🎯 Quick Setup with Test Data

Follow these steps to populate your app with sample businesses and food items for testing.

---

## 📝 Step-by-Step Instructions

### **Step 1: Create an Owner Account**

First, you need at least one restaurant owner account:

1. Open your app
2. Click "Sign Up"
3. Fill in details:
   - Full Name: Test Owner
   - Email: owner@test.com
   - Phone: 9876543210
   - **Select: Restaurant Owner** ✅
   - Password: test123
4. Click "Sign Up"
5. Login with owner@test.com / test123

### **Step 2: Run Sample Data SQL**

Now add sample businesses and food:

1. Go to Supabase SQL Editor
2. Open the file: `easy-sample-data.sql`
3. Copy **ALL** the content
4. Paste in SQL Editor
5. Click **RUN**

You should see:
```
✅ Sample data created successfully!
Created 5 businesses with 30 food items
```

### **Step 3: Test the App**

Now test with the sample data:

1. **Logout** from owner account
2. **Login as customer** (or create a new customer account)
3. **Search nearby** with 10km range
4. You should see all 5 sample businesses!

---

## 🏪 What Sample Data Includes

### **5 Businesses:**

1. **Sharma Sweets & Snacks** (Sweet Shop)
   - Location: MG Road, Bangalore
   - 5 food items (Mysore Pak, Gulab Jamun, etc.)

2. **Punjab Dhaba** (Dhaba)
   - Location: Old Airport Road, Bangalore
   - 6 food items (Butter Chicken, Dal Makhani, etc.)

3. **South Indian Delights** (Restaurant)
   - Location: Koramangala, Bangalore
   - 5 food items (Masala Dosa, Idli, etc.)

4. **Coffee House Cafe** (Cafe)
   - Location: Indiranagar, Bangalore
   - 6 food items (Cappuccino, Latte, Cake, etc.)

5. **Chaat Corner** (Street Food Stall)
   - Location: Brigade Road, Bangalore
   - 6 food items (Pani Puri, Vada Pav, etc.)

### **Total: 30 Food Items**

All categorized properly:
- ✅ Sweets
- ✅ Non-Veg
- ✅ Veg
- ✅ Beverages
- ✅ Fast Food
- ✅ Street Food
- ✅ Desserts
- ✅ Bakery

---

## 🗺️ Location Coordinates

Sample data uses **Bangalore coordinates**. To test properly:

**Option 1: Use Bangalore Coordinates (Recommended)**
- Open app settings
- Manually set location to Bangalore
- Or use location spoofing in simulator

**Option 2: Update Coordinates**
- Edit `easy-sample-data.sql`
- Replace latitude/longitude with your area
- Example coordinates for other cities:
  - **Mumbai**: 19.0760, 72.8777
  - **Delhi**: 28.7041, 77.1025
  - **Hyderabad**: 17.3850, 78.4867
  - **Chennai**: 13.0827, 80.2707

---

## 🧪 Testing Scenarios

### **Test Search by Range:**
1. Select 5km range → Should show nearby businesses
2. Select 20km range → Should show more businesses
3. Try different ranges

### **Test Search by Food:**
1. Search "biryani" → Should show Punjab Dhaba
2. Search "dosa" → Should show South Indian Delights
3. Search "cake" → Should show Coffee House Cafe

### **Test Categories:**
1. Browse Sweets → Sharma Sweets
2. Browse Non-Veg → Punjab Dhaba
3. Browse Street Food → Chaat Corner

### **Test Business Details:**
1. Click on any business
2. View menu items
3. Try "Call" button
4. Try "Directions" button

---

## 🔄 Reset Sample Data

If you want to start fresh:

```sql
-- Delete all sample data
DELETE FROM food_items;
DELETE FROM businesses WHERE business_name LIKE '%Sharma%' 
  OR business_name LIKE '%Punjab%'
  OR business_name LIKE '%South Indian%'
  OR business_name LIKE '%Coffee House%'
  OR business_name LIKE '%Chaat%';

-- Then run easy-sample-data.sql again
```

---

## ➕ Add Your Own Data

After testing with sample data, add real businesses:

1. **Login as owner**
2. **Add your real business:**
   - Business name
   - Type (Restaurant, Dhaba, etc.)
   - Phone number
   - Description
   - Location (auto-detected)

3. **Add food items:**
   - Name
   - Price
   - Description
   - Category
   - Upload photo

---

## 📊 Verify Data

Check in Supabase Table Editor:

1. **businesses table** → Should have 5 rows
2. **food_items table** → Should have 30 rows
3. All linked to your owner account ✅

---

## 💡 Tips

- **Use realistic prices**: Helps with testing
- **Vary locations**: Spread across different areas
- **Test distance**: Check if proximity search works
- **Add variety**: Different food types and categories
- **Test images**: Add food photos for better UX

---

## 🚀 Ready to Test!

After running the sample data SQL:
- ✅ 5 businesses ready
- ✅ 30 food items ready
- ✅ All categories covered
- ✅ Different locations set
- ✅ Realistic prices

**Start searching and testing the app!** 🎉
