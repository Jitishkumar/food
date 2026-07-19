# 🍽️ Food Discover - Regional Food Discovery App

**Find authentic local food near you!**

Food Discover is a mobile app that helps travelers and food lovers discover regional specialties and find nearby restaurants, dhabas, and sweet shops. Restaurant owners can post their food items with location-based visibility.

---

## 🚀 Startup Potential

This app solves real problems in the food discovery market:

- **For Travelers**: Discover what's special in any region (district/state/country)
- **For Locals**: Find authentic local food within custom ranges (1-40km)
- **For Small Businesses**: Get visibility without expensive ads (dhabas, sweet shops, local restaurants)
- **Unique Features**: Regional specialties database + proximity-based search + direct contact

### Monetization Ideas
- Premium listings for restaurant owners
- Featured posts in search results
- Commission on orders
- Ads from food delivery services
- Subscription for advanced analytics

---

## ✨ Features

### For Customers
- 🔍 **Search by Range**: Find food within 1km, 5km, 10km, 20km, 30km, or 40km
- ⭐ **Special Foods**: Discover regional specialties by district/state/country
- 📍 **Location-Based**: Auto-detect your location and find nearby options
- 📞 **Direct Contact**: Call restaurants or open Google Maps for directions
- ⭐ **Reviews & Ratings**: Rate and review food items and restaurants
- 🏷️ **Categories**: Browse by Sweets, Non-Veg, Veg, Beverages, Fast Food, etc.

### For Restaurant Owners
- 🏪 **Business Profiles**: Create and manage multiple business locations
- 🍕 **Post Food Items**: Add food with photos, prices, and descriptions
- 📍 **Auto Location**: Location automatically saved (latitude/longitude)
- 📊 **Dashboard**: Track your businesses, food items, and reviews
- ✅ **Manage Availability**: Mark items as available/unavailable

---

## 🛠️ Tech Stack

- **Frontend**: React Native (Expo)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Maps**: Google Maps integration (no API cost for opening maps)
- **Location**: Expo Location API
- **Image Upload**: Expo Image Picker
- **Navigation**: React Navigation

---

## 📱 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo Go app on your phone (for testing)
- Supabase account (free tier available)

### Step 1: Clone and Install Dependencies

```bash
cd food-discover
npm install
```

### Step 2: Set Up Supabase

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for the database to be ready

2. **Run Database Schema**
   - Open your Supabase project dashboard
   - Go to SQL Editor
   - Copy and paste the contents of `database-schema.sql`
   - Click "Run" to create all tables and functions

3. **Get Your Credentials**
   - Go to Settings → API
   - Copy your `Project URL` and `anon/public key`

4. **Update Configuration**
   - Open `supabase-config.js`
   - Replace `YOUR_SUPABASE_URL` with your Project URL
   - Replace `YOUR_SUPABASE_ANON_KEY` with your anon key

```javascript
const SUPABASE_URL = 'https://sikuvuepkmuoxvrwvjyo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpa3V2dWVwa211b3h2cnd2anlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMjkyOTMsImV4cCI6MjA3NDkwNTI5M30.6X4kOEc02VhyTkd2SOnEIic1WKxYgPgcV027W8WyG8c';
```

### Step 3: Run the App

```bash
# Start the development server
npm start

# Or run on specific platform
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run web      # Web browser
```

Scan the QR code with:
- **iOS**: Camera app
- **Android**: Expo Go app

---

## 📂 Project Structure

```
food-discover/
├── screens/
│   ├── LoginScreen.js              # User login
│   ├── RegisterScreen.js           # User registration with role selection
│   ├── HomeScreen.js               # Customer home (search & discover)
│   ├── OwnerDashboard.js           # Restaurant owner dashboard
│   ├── AddBusinessScreen.js        # Add new business
│   ├── AddFoodItemScreen.js        # Add food items to business
│   ├── SpecialFoodsScreen.js       # Browse regional specialties
│   └── BusinessDetailScreen.js     # View business details, menu, reviews
├── App.js                          # Main app with navigation
├── supabase-config.js              # Supabase configuration
├── database-schema.sql             # Complete database schema
├── app.json                        # Expo configuration
└── package.json                    # Dependencies
```

---

## 🗄️ Database Schema

### Tables
- **profiles**: User accounts (customer/owner)
- **businesses**: Restaurant/dhaba/sweet shop profiles
- **categories**: Food categories (Sweets, Non-Veg, etc.)
- **special_foods**: Regional specialty foods (admin curated)
- **food_items**: Food items posted by businesses
- **reviews**: User reviews and ratings

### Key Functions
- `calculate_distance()`: Calculate distance between two coordinates
- `search_businesses_nearby()`: Search businesses within range with filters

---

## 🎯 How to Use

### As a Customer

1. **Register/Login**
   - Select "Customer" during registration
   - Login with your credentials

2. **Search for Food**
   - Enter food name or cuisine in search bar
   - Select search range (1-40km)
   - Click "Search Nearby"

3. **Discover Special Foods**
   - Tap "Special Foods" to see regional specialties
   - Filter by District/State/Country
   - Select a food to search nearby availability

4. **View Business Details**
   - Tap any business card to see full details
   - View menu, reviews, and contact info
   - Call directly or open in Google Maps

5. **Leave Reviews**
   - Rate businesses (1-5 stars)
   - Write comments about your experience

### As a Restaurant Owner

1. **Register/Login**
   - Select "Restaurant Owner" during registration
   - Login with your credentials

2. **Add Your Business**
   - Tap "Add New Business"
   - Fill in business details
   - Location is auto-detected
   - Upload business photo

3. **Add Food Items**
   - Select a business
   - Tap "Add Food"
   - Choose category (Sweets, Non-Veg, etc.)
   - Add name, price, description, and photo

4. **Manage Your Listings**
   - View all your businesses
   - Edit food availability
   - Track reviews and ratings

---

## 🔐 Security Features

- Row Level Security (RLS) enabled on all tables
- Users can only edit their own data
- Phone numbers visible only when viewing business details
- Secure authentication with Supabase Auth

---

## 🌟 Future Enhancements

### Phase 2
- [ ] Image upload to cloud storage (Cloudinary/S3)
- [ ] Push notifications for new reviews
- [ ] Favorite/bookmark businesses
- [ ] Share food items on social media
- [ ] Advanced filters (price range, ratings)

### Phase 3
- [ ] In-app messaging between customers and owners
- [ ] Order placement with cash on delivery
- [ ] Business analytics dashboard
- [ ] Premium subscriptions
- [ ] Multi-language support

### Phase 4
- [ ] AI-powered food recommendations
- [ ] Food delivery integration
- [ ] Loyalty programs
- [ ] Event/festival special foods
- [ ] Food blogger partnerships

---

## 🐛 Troubleshooting

### Location Not Working
- Make sure location permissions are granted
- Check if location services are enabled on your device
- Try refreshing location in the app

### Images Not Uploading
- Currently, images are stored locally (URI)
- For production, integrate cloud storage (Cloudinary/AWS S3)

### Database Errors
- Verify Supabase credentials in `supabase-config.js`
- Check if database schema was run successfully
- Ensure RLS policies are enabled

### App Not Starting
```bash
# Clear cache and restart
npm start -- --clear

# Reinstall dependencies
rm -rf node_modules
npm install
```

---

## 📄 License

This project is open source and available for personal and commercial use.

---

## 👨‍💻 Developer Notes

### Adding New Categories
```sql
INSERT INTO categories (name, icon) VALUES ('Pizza', '🍕');
```

### Adding Special Foods (Admin)
```sql
INSERT INTO special_foods (name, region, region_type, description) 
VALUES ('Mysore Pak', 'Karnataka', 'state', 'Famous sweet from Karnataka');
```

### Testing Nearby Search
- Use different range values to test proximity search
- Test with multiple businesses at different distances
- Verify Google Maps integration on actual device

---

## 🤝 Contributing

This is a startup project. If you want to contribute or partner:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📞 Support

For questions or support:
- Create an issue in the repository
- Email: support@fooddiscover.app (example)

---

## 🎉 Success Metrics to Track

- Number of registered users (customers vs owners)
- Number of businesses listed
- Number of food items posted
- Search queries per day
- Reviews and ratings submitted
- User retention rate
- Geographic coverage (cities/states)

---

**Built with ❤️ for food lovers and local businesses**

Start discovering authentic local food today! 🍽️








#OwnerDashboard.js  i want in right top right show stars of post card in everypost card and customer can mark rating with reviews and in last of bussiness post card u will see reviews u can select star rating like 5 to see 5 star rating and reviews 1 star to see rating and reviews and report look i am leaving it on u i am just telling u my ideaa build it like i want owner will post fisst his shop location fetch automatically and then he can add products in it user can buy to buy it look for buying he will click on buy on contact if clicked on contact he will see owner phone number whatsapp number when click on buy he will get unique 5 digit code which a owner has to type in his account after delivering that delivery for each buy user will recive some coins like 2 coins for each buy i want when user will click on buy he will see 5 digit code when owner will type in his account like owner will get notification by username he can declince also he has to enter code then user will see a image which can be pament details mention it like owner qr for payment when user will pay on it and owner approve it he will get coins also in bottom bar make button more here owner can see anything like room for rent any srvice like owner wants to be driver with the salary he is expecting tent person amount for days ,dancer per hour charge, freelancer charges for website i want like thisdo all this u can annalyze my all #src  src folder so u will get idea. for this 