# Fix Delete Business Issue - Complete Guide

## 🐛 Problem
Business cannot be deleted from the app. The delete button doesn't work and businesses remain in the database.

## 🔍 Root Cause
**Missing RLS DELETE Policy** - The businesses table has RLS enabled but no DELETE policy, so authenticated users cannot delete their own businesses.

---

## ✅ Solution - Run These SQL Scripts

### **Step 1: Add DELETE Policy for Businesses** (REQUIRED)

**File:** `/sql/fix_delete_rls_policy.sql`

Open your **Supabase SQL Editor** and run:

```sql
-- Add DELETE policy for businesses
CREATE POLICY "Owners can delete own businesses"
ON public.businesses
FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);
```

This allows business owners to delete their own businesses.

---

### **Step 2: Fix CASCADE DELETE** (RECOMMENDED)

**File:** `/sql/fix_cascade_delete.sql`

This ensures when a business is deleted, all related data (food items, reviews, reports) are also automatically deleted.

Run the entire file in **Supabase SQL Editor**.

**What it does:**
- ✅ Adds CASCADE DELETE to food_items → businesses relationship
- ✅ Adds CASCADE DELETE to food_item_reviews → food_items relationship
- ✅ Adds CASCADE DELETE to food_item_reports → food_items relationship
- ✅ Adds DELETE policies for all related tables
- ✅ Verifies all constraints are properly set

---

## 📋 Current RLS Policies

### Before Fix:
```
Businesses Table RLS Policies:
✅ SELECT - "Businesses are viewable by everyone"
✅ INSERT - "Owners can create businesses"
✅ UPDATE - "Owners can update own businesses"
❌ DELETE - MISSING! (This is the problem)
```

### After Fix:
```
Businesses Table RLS Policies:
✅ SELECT - "Businesses are viewable by everyone"
✅ INSERT - "Owners can create businesses"
✅ UPDATE - "Owners can update own businesses"
✅ DELETE - "Owners can delete own businesses" (NEW!)
```

---

## 🔧 How to Apply the Fix

### Option A: Quick Fix (Minimum Required)
1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy and paste this:
   ```sql
   CREATE POLICY "Owners can delete own businesses"
   ON public.businesses
   FOR DELETE
   TO authenticated
   USING (auth.uid() = owner_id);
   ```
4. Click **Run**
5. Done! ✅

### Option B: Complete Fix (Recommended)
1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Run **fix_delete_rls_policy.sql** (from Step 1)
4. Run **fix_cascade_delete.sql** (from Step 2)
5. Verify policies are created
6. Done! ✅

---

## 🧪 Testing

### After Running the SQL:

1. **Reload your app** (press 'r' in Expo terminal)
2. Go to **OwnerDashboard**
3. Click on any business
4. Scroll to bottom
5. Click **"Delete Business"**
6. Confirm deletion
7. Click **"OK"** on success alert

### Expected Results:
- ✅ Success alert shows: "Business deleted successfully"
- ✅ Navigates back to OwnerDashboard
- ✅ Business is removed from the list
- ✅ Business is deleted from database
- ✅ All food items are also deleted (if CASCADE is set up)
- ✅ All reviews are also deleted (if CASCADE is set up)

### Verify in Supabase:
1. Go to **Table Editor** → **businesses**
2. Check if the business is gone
3. Go to **food_items** table
4. Check if related food items are also gone

---

## 📊 Database Relationships

```
businesses (owner_id → profiles.id)
    ↓ ON DELETE CASCADE
food_items (business_id → businesses.id)
    ↓ ON DELETE CASCADE
food_item_reviews (food_item_id → food_items.id)
food_item_reports (food_item_id → food_items.id)
```

**When you delete a business:**
1. Business record is deleted
2. All food_items for that business are deleted (CASCADE)
3. All reviews for those food items are deleted (CASCADE)
4. All reports for those food items are deleted (CASCADE)

---

## 🔐 RLS Policies Needed

### businesses table:
```sql
-- SELECT (already exists)
CREATE POLICY "Businesses are viewable by everyone"
ON businesses FOR SELECT TO public
USING (true);

-- INSERT (already exists)
CREATE POLICY "Owners can create businesses"
ON businesses FOR INSERT TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- UPDATE (already exists)
CREATE POLICY "Owners can update own businesses"
ON businesses FOR UPDATE TO authenticated
USING (auth.uid() = owner_id);

-- DELETE (NEW - needs to be added)
CREATE POLICY "Owners can delete own businesses"
ON businesses FOR DELETE TO authenticated
USING (auth.uid() = owner_id);
```

### food_items table:
```sql
-- DELETE (recommended)
CREATE POLICY "Owners can delete own food items"
ON food_items FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM businesses 
    WHERE businesses.id = food_items.business_id 
    AND businesses.owner_id = auth.uid()
  )
);
```

---

## 🚨 Common Errors

### Error: "new row violates row-level security policy"
**Cause:** Missing DELETE policy  
**Fix:** Run Step 1 SQL (add DELETE policy)

### Error: "update or delete on table violates foreign key constraint"
**Cause:** Foreign keys don't have CASCADE DELETE  
**Fix:** Run Step 2 SQL (fix CASCADE DELETE)

### Error: "permission denied for table businesses"
**Cause:** User is not authenticated or not the owner  
**Fix:** Ensure user is logged in and owns the business

---

## 📝 Summary

**Problem:** Cannot delete businesses from app  
**Root Cause:** Missing RLS DELETE policy  
**Solution:** Add DELETE policy to businesses table  
**Bonus:** Set up CASCADE DELETE for clean data removal  

**Files to Run:**
1. ✅ `/sql/fix_delete_rls_policy.sql` (REQUIRED)
2. ✅ `/sql/fix_cascade_delete.sql` (RECOMMENDED)

**After running SQL:**
- Reload your app
- Test delete functionality
- Verify in Supabase database

---

## ✅ Checklist

- [ ] Run `fix_delete_rls_policy.sql` in Supabase SQL Editor
- [ ] Run `fix_cascade_delete.sql` in Supabase SQL Editor
- [ ] Reload Expo app (press 'r')
- [ ] Test delete business functionality
- [ ] Verify business is deleted from database
- [ ] Verify food items are also deleted
- [ ] Verify dashboard refreshes automatically

---

**Once you run the SQL scripts, the delete functionality will work perfectly!** 🎉
