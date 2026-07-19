# Complete Feature Implementation Guide

This document outlines the implementation of the major features requested:
1. Star ratings on business cards
2. Review filtering by stars
3. Purchase code system with 5-digit codes
4. Coins/rewards system
5. Service marketplace ("More" tab)

## Step 1: Run Database Migration

Execute the SQL file in your Supabase dashboard:
```sql
-- File: /sql/complete_feature_expansion.sql
```

This creates:
- `purchase_codes` table
- `user_coins` table
- `coin_transactions` table
- `service_categories` table
- `services` table
- `service_reviews` table
- Triggers for coin rewards
- Helper functions

## Step 2: Components Created

### ✅ StarRating.js
Reusable star rating component with:
- Display mode (non-interactive)
- Interactive mode (for ratings)
- Half-star support
- Customizable size

### ✅ PurchaseCodeModal.js
Complete purchase flow:
- Generates unique 5-digit code
- Shows payment QR/UPI details
- Tracks purchase status
- Awards coins when verified

## Step 3: Screens to Create

### 1. OwnerCodeVerificationScreen.js

```javascript
// Shows pending purchase codes for owner
// Allows entering customer code to verify
// Updates purchase status
// Triggers coin reward
```

**Features:**
- List of pending purchases
- Code input field
- Approve/Decline buttons
- Real-time updates

### 2. CoinsScreen.js

```javascript
// Shows user coin balance
// Transaction history
// Redemption options
```

**Features:**
- Current balance display
- Earned/Spent breakdown
- Transaction list with filtering
- Coin redemption marketplace

### 3. ServiceMarketplaceScreen.js

```javascript
// Browse services by category
// Search and filter
// Location-based results
```

**Features:**
- Service categories grid
- Search with filters
- Distance-based sorting
- Star ratings on cards

### 4. AddServiceScreen.js

```javascript
// Create new service listing
// Similar to AddBusinessScreen
```

**Features:**
- Service details form
- Category selection
- Price type (hourly/daily/monthly/fixed)
- Location picker
- Image upload
- Contact details (phone/WhatsApp)

### 5. ServiceDetailScreen.js

```javascript
// View service details
// Contact seller
// Leave reviews
```

**Features:**
- Full service information
- Star ratings and reviews
- Contact buttons
- Location map
- Report option

## Step 4: Update Existing Screens

### HomeScreen.js Updates

**Add Star Ratings to Food Cards:**
```javascript
// In the food card render:
<View style={styles.foodCardHeader}>
  <StarRating 
    rating={item.average_rating || 0} 
    size={16}
    showNumber={true}
  />
  <Text style={styles.reviewCount}>
    ({item.total_reviews || 0} reviews)
  </Text>
</View>
```

**Replace Purchase Flow:**
```javascript
// Replace handlePurchase function:
const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
const [selectedPurchaseItem, setSelectedPurchaseItem] = useState(null);

const handleBuyClick = (item) => {
  setSelectedPurchaseItem(item);
  setPurchaseModalVisible(true);
};

// In JSX:
<PurchaseCodeModal
  visible={purchaseModalVisible}
  onClose={() => setPurchaseModalVisible(false)}
  foodItem={selectedPurchaseItem}
  onSuccess={() => {
    Alert.alert('Success', 'Purchase initiated! Check your notifications.');
    searchNearby(); // Refresh
  }}
/>
```

### BusinessDetailScreen.js Updates

**Add Review Filtering:**
```javascript
const [selectedStarFilter, setSelectedStarFilter] = useState(null); // null = all

const renderStarFilter = () => (
  <ScrollView horizontal style={styles.filterContainer}>
    <TouchableOpacity
      style={[styles.filterChip, !selectedStarFilter && styles.filterChipActive]}
      onPress={() => setSelectedStarFilter(null)}
    >
      <Text style={styles.filterText}>All</Text>
    </TouchableOpacity>
    {[5, 4, 3, 2, 1].map((stars) => (
      <TouchableOpacity
        key={stars}
        style={[styles.filterChip, selectedStarFilter === stars && styles.filterChipActive]}
        onPress={() => setSelectedStarFilter(stars)}
      >
        <StarRating rating={stars} size={14} showNumber={false} />
        <Text style={styles.filterText}>({reviewCounts[stars] || 0})</Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

const filteredReviews = selectedStarFilter
  ? reviews.filter(r => r.rating === selectedStarFilter)
  : reviews;
```

### OwnerDashboard.js Updates

**Add Pending Purchases Tab:**
```javascript
<Tab.Screen
  name="PendingPurchases"
  component={OwnerCodeVerificationScreen}
  options={{
    tabBarLabel: 'Pending',
    tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🛒</Text>,
    tabBarBadge: pendingCount > 0 ? pendingCount : null,
  }}
/>
```

**Add Coins Widget:**
```javascript
// In dashboard stats:
const [coins, setCoins] = useState(0);

useEffect(() => {
  loadCoins();
}, []);

const loadCoins = async () => {
  const { data } = await supabase
    .from('user_coins')
    .select('balance')
    .eq('user_id', user.id)
    .single();
  setCoins(data?.balance || 0);
};

// In JSX:
<View style={styles.coinsWidget}>
  <Text style={styles.coinsIcon}>🪙</Text>
  <Text style={styles.coinsText}>{coins} Coins</Text>
</View>
```

## Step 5: Navigation Updates

### AppNavigator.js Updates

**Add "More" Tab:**
```javascript
<Tab.Screen
  name="More"
  component={MoreTabScreen}
  options={{
    tabBarLabel: 'More',
    tabBarIcon: ({ focused }) => (
      <Text style={{ fontSize: 24 }}>{focused ? '⚡' : '⭐'}</Text>
    ),
  }}
/>
```

**Add New Screens to Stack:**
```javascript
<Stack.Screen name="ServiceMarketplace" component={ServiceMarketplaceScreen} />
<Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
<Stack.Screen name="AddService" component={AddServiceScreen} />
<Stack.Screen name="CoinsScreen" component={CoinsScreen} />
<Stack.Screen name="OwnerVerification" component={OwnerCodeVerificationScreen} />
```

### Create MoreTabScreen.js

```javascript
// Simple menu screen with options:
export default function MoreTabScreen({ navigation }) {
  const options = [
    { id: 'services', title: 'Service Marketplace', icon: '💼', screen: 'ServiceMarketplace' },
    { id: 'jobs', title: 'Jobs', icon: '💼', category: 'Jobs' },
    { id: 'rooms', title: 'Rooms for Rent', icon: '🏠', category: 'Rooms for Rent' },
    { id: 'freelance', title: 'Freelance', icon: '💻', category: 'Freelance' },
    { id: 'drivers', title: 'Drivers', icon: '🚗', category: 'Drivers' },
    { id: 'events', title: 'Event Services', icon: '🎭', category: 'Event Services' },
    { id: 'coins', title: 'My Coins', icon: '🪙', screen: 'CoinsScreen' },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>More Services</Text>
      {options.map((option) => (
        <TouchableOpacity
          key={option.id}
          style={styles.optionCard}
          onPress={() => {
            if (option.screen) {
              navigation.navigate(option.screen);
            } else {
              navigation.navigate('ServiceMarketplace', { category: option.category });
            }
          }}
        >
          <Text style={styles.optionIcon}>{option.icon}</Text>
          <Text style={styles.optionTitle}>{option.title}</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
```

## Step 6: Real-time Notifications

### Add Supabase Realtime Subscription

```javascript
// In OwnerCodeVerificationScreen:
useEffect(() => {
  const subscription = supabase
    .channel('purchase_codes_channel')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'purchase_codes',
      filter: `business_id=eq.${businessId}`
    }, (payload) => {
      // New purchase code created
      Alert.alert('New Purchase!', 'You have a new purchase request.');
      loadPendingPurchases();
    })
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, [businessId]);
```

## Step 7: Push Notifications (Optional)

For better UX, implement Expo Notifications:

```bash
npm install expo-notifications
```

```javascript
// When owner verifies code:
await sendPushNotification(customerId, {
  title: 'Purchase Verified!',
  body: 'You earned 2 coins! 🪙',
});
```

## Key Features Summary

### Purchase Flow
1. Customer clicks "Buy" on food item
2. System generates unique 5-digit code
3. Customer sees code + payment QR/UPI
4. Customer pays and shares code with owner
5. Owner enters code in verification screen
6. System verifies match and updates status
7. Customer gets 2 coins automatically

### Coins System
- Earn 2 coins per verified purchase
- View balance in profile/coins screen
- See transaction history
- Future: Redeem for discounts

### Service Marketplace
- Post any service (jobs, rooms, freelance, etc.)
- Category-based browsing
- Location-based search
- Star ratings and reviews
- Contact via phone/WhatsApp

### Review System Enhancements
- Star ratings visible on all cards
- Filter reviews by star count
- Count reviews per star level
- Average rating calculation
- Review date display

## Testing Checklist

- [ ] Run SQL migration successfully
- [ ] Test purchase code generation
- [ ] Verify code validation works
- [ ] Check coins are awarded correctly
- [ ] Test service marketplace CRUD
- [ ] Verify star ratings display
- [ ] Test review filtering
- [ ] Check real-time updates
- [ ] Test payment QR display
- [ ] Verify WhatsApp integration

## Database Indexes

All necessary indexes are created in the SQL migration for optimal performance:
- purchase_codes: code, customer_id, business_id, status
- user_coins: user_id
- services: owner_id, category_id, location
- All foreign keys indexed

## Security Considerations

- RLS policies prevent unauthorized access
- Purchase codes expire after 24 hours
- Only business owners can verify their codes
- Users can only view their own coins
- Service owners can only edit their listings

## Future Enhancements

1. **Push Notifications** - Real-time alerts
2. **Chat System** - In-app messaging
3. **Coin Redemption** - Discount marketplace
4. **Service Booking** - Calendar integration
5. **Reviews with Images** - Photo uploads
6. **Verified Badges** - Trust indicators
7. **Analytics Dashboard** - Business insights
8. **Referral System** - Earn coins by referring friends

## File Structure

```
/src
  /components
    - StarRating.js ✅
    - PurchaseCodeModal.js ✅
    - CoinsWidget.js (create)
  /screens
    - HomeScreen.js (update)
    - BusinessDetailScreen.js (update)
    - OwnerDashboard.js (update)
    - OwnerCodeVerificationScreen.js (create)
    - CoinsScreen.js (create)
    - ServiceMarketplaceScreen.js (create)
    - AddServiceScreen.js (create)
    - ServiceDetailScreen.js (create)
    - MoreTabScreen.js (create)
/sql
  - complete_feature_expansion.sql ✅
```

## Next Steps

1. Run the SQL migration in Supabase dashboard
2. Test the two components I created
3. I can create the remaining screens if you'd like
4. Update the navigation structure
5. Test end-to-end flows

Would you like me to create the remaining screens now?
