# 📱 Food Discover - App Flow Diagram

## 🎯 Complete User Journey

```
┌─────────────────────────────────────────────────────────────┐
│                     APP LAUNCH                               │
│                         ↓                                    │
│              Check Authentication                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
        ┌─────────────────┴─────────────────┐
        ↓                                   ↓
   NOT LOGGED IN                      LOGGED IN
        ↓                                   ↓
┌───────────────┐                  ┌────────────────┐
│ LOGIN SCREEN  │                  │ Check User Type│
│               │                  └────────────────┘
│ - Email       │                          ↓
│ - Password    │              ┌───────────┴───────────┐
│ - Sign Up Link│              ↓                       ↓
└───────────────┘         CUSTOMER                  OWNER
        ↓                    ↓                       ↓
┌───────────────┐    ┌──────────────┐      ┌──────────────┐
│REGISTER SCREEN│    │  HOME SCREEN │      │OWNER DASHBOARD│
│               │    │  (Customer)  │      │              │
│ - Full Name   │    └──────────────┘      └──────────────┘
│ - Email       │
│ - Phone       │
│ - Password    │
│ - User Type:  │
│   • Customer  │
│   • Owner     │
└───────────────┘
```

---

## 👤 Customer Flow

```
┌──────────────────────────────────────────────────────────────┐
│                      HOME SCREEN                              │
│                                                               │
│  🍽️ Food Discover                          [Logout]          │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Search for food, restaurant, or cuisine...          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  Search Range:                                                │
│  [1km] [5km] [10km] [20km] [30km] [40km]                    │
│                                                               │
│  [🔍 Search Nearby]                                          │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │ ⭐ Special   │  │ 📋 Categories│                         │
│  │    Foods     │  │              │                         │
│  └──────────────┘  └──────────────┘                         │
│                                                               │
│  Results:                                                     │
│  ┌─────────────────────────────────────────┐                │
│  │ 🏪 Sharma Dhaba                         │                │
│  │ Dhaba                                    │                │
│  │ 📍 2.3 km away  ⭐ 4.5                  │                │
│  │ [📞 Call] [🗺️ Directions]              │                │
│  └─────────────────────────────────────────┘                │
└──────────────────────────────────────────────────────────────┘
                          ↓
        ┌─────────────────┴─────────────────┐
        ↓                                   ↓
┌──────────────────┐              ┌──────────────────┐
│ SPECIAL FOODS    │              │ BUSINESS DETAIL  │
│                  │              │                  │
│ Search: [____]   │              │ Sharma Dhaba     │
│                  │              │ Dhaba            │
│ Filter:          │              │ ⭐ 4.5 (23 reviews)│
│ [All] [District] │              │                  │
│ [State] [Country]│              │ [📞 Call]        │
│                  │              │ [🗺️ Directions]  │
│ ┌──────────────┐ │              │                  │
│ │⭐ Hyderabadi │ │              │ Menu (12 items)  │
│ │   Biryani    │ │              │ ┌──────────────┐ │
│ │📍 Hyderabad  │ │              │ │🍗 Chicken    │ │
│ │District      │ │              │ │   Biryani    │ │
│ └──────────────┘ │              │ │₹250          │ │
│                  │              │ └──────────────┘ │
│ [Search Nearby]  │              │                  │
└──────────────────┘              │ Reviews:         │
                                  │ ⭐⭐⭐⭐⭐        │
                                  │ "Great food!"    │
                                  │                  │
                                  │ Add Review:      │
                                  │ [☆☆☆☆☆]        │
                                  │ [Submit Review]  │
                                  └──────────────────┘
```

---

## 🏪 Restaurant Owner Flow

```
┌──────────────────────────────────────────────────────────────┐
│                   OWNER DASHBOARD                             │
│                                                               │
│  🏪 Owner Dashboard                        [Logout]          │
│                                                               │
│  Stats:                                                       │
│  ┌──────┐  ┌──────┐  ┌──────┐                               │
│  │  3   │  │  25  │  │  18  │                               │
│  │Business│ │Foods │  │Reviews│                              │
│  └──────┘  └──────┘  └──────┘                               │
│                                                               │
│  [➕ Add New Business]                                       │
│                                                               │
│  My Businesses:                                               │
│  ┌─────────────────────────────────────────┐                │
│  │ 🏪 Sharma Dhaba                         │                │
│  │ Dhaba                                    │                │
│  │ 📞 9876543210                           │                │
│  │ ✅ Active                               │                │
│  │ [➕ Add Food]                           │                │
│  └─────────────────────────────────────────┘                │
└──────────────────────────────────────────────────────────────┘
                          ↓
        ┌─────────────────┴─────────────────┐
        ↓                                   ↓
┌──────────────────┐              ┌──────────────────┐
│ ADD BUSINESS     │              │ ADD FOOD ITEM    │
│                  │              │                  │
│ Business Name *  │              │ Food Name *      │
│ [____________]   │              │ [____________]   │
│                  │              │                  │
│ Business Type *  │              │ Category *       │
│ [🍽️ Restaurant] │              │ [🍰][🍗][🥗]   │
│ [🚛 Dhaba]      │              │ [🥤][🍔][🌮]   │
│ [🍰 Sweet Shop] │              │                  │
│                  │              │ Price (₹)        │
│ Phone Number *   │              │ [____________]   │
│ [____________]   │              │                  │
│                  │              │ Description      │
│ Address          │              │ [____________]   │
│ [____________]   │              │ [____________]   │
│                  │              │                  │
│ Description      │              │ [📷 Add Photo]   │
│ [____________]   │              │                  │
│                  │              │ [Add Food Item]  │
│ [📷 Add Photo]   │              └──────────────────┘
│                  │
│ 📍 Location:     │
│ 28.6139, 77.2090│
│ [🔄 Refresh]     │
│                  │
│ [Add Business]   │
└──────────────────┘
```

---

## 🔄 Key Interactions

### 1. Search Flow
```
User enters search → Selects range → Clicks search
    ↓
App gets current location
    ↓
Database searches within radius
    ↓
Results displayed with distance
    ↓
User clicks business → View details
```

### 2. Special Foods Flow
```
User clicks "Special Foods"
    ↓
Browse regional specialties
    ↓
Filter by District/State/Country
    ↓
Click on food → Alert: "Search nearby?"
    ↓
Search for that food in selected range
```

### 3. Add Business Flow
```
Owner clicks "Add Business"
    ↓
App auto-detects GPS location
    ↓
Owner fills business details
    ↓
Uploads photo (optional)
    ↓
Business saved with coordinates
    ↓
Now visible to nearby customers
```

### 4. Add Food Flow
```
Owner selects business
    ↓
Clicks "Add Food"
    ↓
Selects category (Sweets, Non-Veg, etc.)
    ↓
Enters name, price, description
    ↓
Uploads photo
    ↓
Food item posted
    ↓
Visible in business menu
```

### 5. Review Flow
```
Customer views business
    ↓
Scrolls to reviews section
    ↓
Selects star rating (1-5)
    ↓
Writes comment (optional)
    ↓
Submits review
    ↓
Review appears in business listing
```

---

## 📞 External Integrations

### Phone Calling
```
User clicks [📞 Call] button
    ↓
App opens native phone dialer
    ↓
Phone number pre-filled
    ↓
User can call directly
```

### Google Maps
```
User clicks [🗺️ Directions] button
    ↓
App opens Google Maps (or Apple Maps on iOS)
    ↓
Destination set to business location
    ↓
User gets turn-by-turn directions
```

---

## 🔐 Authentication Flow

```
┌─────────────────────────────────────────────────────────┐
│                    AUTHENTICATION                        │
└─────────────────────────────────────────────────────────┘
                          ↓
        ┌─────────────────┴─────────────────┐
        ↓                                   ↓
    REGISTER                             LOGIN
        ↓                                   ↓
Create Supabase Auth User          Check credentials
        ↓                                   ↓
Create Profile Record              Get user profile
        ↓                                   ↓
Set user_type (customer/owner)     Load user_type
        ↓                                   ↓
        └─────────────────┬─────────────────┘
                          ↓
                   Session Created
                          ↓
        ┌─────────────────┴─────────────────┐
        ↓                                   ↓
   CUSTOMER                              OWNER
   Home Screen                      Dashboard Screen
```

---

## 🗄️ Database Interactions

### Customer Searching
```
1. User enters search query + range
2. App gets current GPS coordinates
3. Call: search_businesses_nearby(lat, lon, range, query)
4. Database calculates distances
5. Returns businesses within range
6. App displays sorted by distance
```

### Owner Posting Food
```
1. Owner fills food item form
2. Selects category
3. Uploads image (optional)
4. App inserts into food_items table
5. Linked to business_id
6. Now searchable by customers
```

### Reviews System
```
1. Customer rates business (1-5 stars)
2. Writes comment
3. App inserts into reviews table
4. Linked to user_id and business_id
5. Average rating calculated
6. Displayed on business card
```

---

## 🎯 User Permissions

### Location Permission
```
App Launch
    ↓
Request location permission
    ↓
┌───────────────────────────────────┐
│ Allow "Food Discover" to access  │
│ your location?                    │
│                                   │
│ [Allow While Using App]           │
│ [Allow Once]                      │
│ [Don't Allow]                     │
└───────────────────────────────────┘
    ↓
Permission Granted → Search works
Permission Denied → Show error message
```

### Camera/Photo Permission
```
User clicks "Add Photo"
    ↓
Request camera/photo permission
    ↓
┌───────────────────────────────────┐
│ Allow "Food Discover" to access  │
│ your photos?                      │
│                                   │
│ [Allow]                           │
│ [Don't Allow]                     │
└───────────────────────────────────┘
    ↓
Permission Granted → Image picker opens
Permission Denied → Show error message
```

---

## 🚀 This Visual Guide Shows:

✅ **Complete app navigation**
✅ **User journeys for both roles**
✅ **Key interactions and flows**
✅ **External integrations**
✅ **Database operations**
✅ **Permission handling**

**Use this to understand how everything connects!**
