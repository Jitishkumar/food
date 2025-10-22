# Location-Based Search System - Setup Guide

## Overview
This document describes the location-based search system with city/state filtering for food items.

---

## 📋 Changes Made

### 1. Database Schema Updates
**File:** `/sql/add_city_state_fields.sql`

**Run this SQL in Supabase SQL Editor:**
- Adds `city` and `state` columns to `businesses` table
- Adds `city` and `state` columns to `food_items` table
- Creates indexes for better search performance
- Creates new search function: `search_food_items_by_location()`

**Search Priority Order:**
1. Food name + City + State match
2. City + State match
3. State match only
4. Distance (closest first)

---

### 2. AddBusinessScreen.js Updates
**Changes:**
- ✅ Extracts city and state from reverse geocoding
- ✅ Displays city and state as read-only fields
- ✅ Saves city and state to database when creating business
- ✅ Address is auto-filled and cannot be edited after location is locked

**Fields:**
- Address (auto-filled, read-only after location fetch)
- City (auto-filled, read-only)
- State (auto-filled, read-only)

---

### 3. AddFoodItemScreen.js Updates
**Changes:**
- ✅ Fetches business details including city and state
- ✅ Displays business location info (address, city, state) as read-only
- ✅ Saves city and state with food item

**Display:**
- Business Location section shows:
  - Address (read-only)
  - City (read-only)
  - State (read-only)

---

### 4. NearbyScreen.js Updates
**Two Tabs:**

#### Tab 1: "Nearby Places"
- Search by food name (optional)
- Search by city (optional)
- Search by state (optional)
- Search range selector (1-40 km)
- Category filter
- Shows active filters as tags
- Search button: "🔍 Search Nearby"

#### Tab 2: "Search Places"
- **Simplified UI with 3 inputs:**
  - Food Name (required)
  - City (required)
  - State (required)
- Search button: "🔍 Search Places"
- No range selector
- No category filter
- No location permission needed

**Search Results Order:**
1. Food name + City + State matching
2. City + State matching
3. State matching
4. Distance (closest first)

---

## 🔧 How It Works

### Adding a Business
1. Owner goes to "Add Business"
2. Clicks "Get Current Location"
3. Address, City, State auto-fill from GPS coordinates
4. Owner clicks "Lock Location"
5. City and State become read-only
6. Business is created with location data

### Adding a Food Item
1. Owner goes to "Add Food Item"
2. Business location (address, city, state) displays automatically
3. Owner enters food details
4. City and State are saved with the food item

### Searching (Nearby Places Tab)
1. User can search by:
   - Food name (optional)
   - City (optional)
   - State (optional)
   - Distance range (1-40 km)
   - Category (optional)
2. Results show matching food items ordered by relevance then distance

### Searching (Search Places Tab)
1. User enters:
   - Food name
   - City
   - State
2. Results show all matching food items ordered by relevance

---

## 📊 Database Functions

### search_food_items_by_location()
```sql
search_food_items_by_location(
  user_lat DOUBLE PRECISION,
  user_lon DOUBLE PRECISION,
  search_radius INTEGER,
  search_query TEXT,
  search_category UUID,
  search_city TEXT,
  search_state TEXT
)
```

**Returns:**
- All food items matching the criteria
- Ordered by relevance (food name + city + state > city + state > state)
- Then by distance (closest first)

---

## 🎯 Features

✅ **Read-only Address:** Cannot be edited after business creation  
✅ **Auto-filled Location:** City and state extracted from GPS  
✅ **Smart Search:** Prioritizes exact matches over partial matches  
✅ **Two Search Modes:** Nearby (with distance) and Search Places (by location)  
✅ **Filter Tags:** Visual display of active search filters  
✅ **Distance Calculation:** Haversine formula for accurate distance  
✅ **Ratings Included:** Average rating shown with search results  

---

## 📱 UI Components

### AddBusinessScreen
```
Business Name
Business Type
Phone Number
Address (auto-filled, read-only)
City (auto-filled, read-only)
State (auto-filled, read-only)
Description
Photo
```

### AddFoodItemScreen
```
Food Name
Business Location (read-only section)
  - Address
  - City
  - State
Category
Price
Description
Inventory Count
Allow Purchase (toggle)
Photo
```

### NearbyScreen - Nearby Places Tab
```
Food Name (optional)
City (optional)
State (optional)
Search Range (1-40 km)
Active Filters (tags)
Search Button
Category Filters
Results List
```

### NearbyScreen - Search Places Tab
```
Food Name
City
State
Search Button
Results List
```

---

## 🚀 Next Steps

1. **Run the SQL migration:**
   - Open Supabase SQL Editor
   - Run `/sql/add_city_state_fields.sql`

2. **Test the flow:**
   - Create a new business with location
   - Add a food item to the business
   - Search using Nearby Places tab
   - Search using Search Places tab

3. **Optional Enhancements:**
   - Add autocomplete for city/state
   - Add saved searches
   - Add search history
   - Add favorites

---

## 📝 Notes

- City and State are extracted from reverse geocoding (GPS coordinates)
- Address cannot be edited after location is locked
- Search is case-insensitive
- Partial matches are supported (e.g., "Delh" matches "Delhi")
- Distance calculation uses Haversine formula
- Results are sorted by relevance first, then by distance

---

**Setup Complete! Your location-based search system is ready to use.** 🎉
