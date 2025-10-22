# Reviews and Reports Feature

## Overview
Added a three-dot menu (⋮) to each food item card in the HomeScreen with two options:
1. **Rate & Review** - Users can give 1-5 star ratings and write reviews
2. **Report** - Users can report inappropriate or problematic food items

## Features Implemented

### 1. Rating & Review System
- **Star Rating**: 1-5 stars (required)
- **Review Text**: Optional text review (max 500 characters)
- **Overall Rating Display**: Shows average rating and total review count on each food card
- **View All Reviews**: Users can see all reviews for a food item
- **Update Reviews**: Users can edit their existing reviews
- **Play Store Style**: Rating display similar to Google Play Store with stars and review count

### 2. Report System
- **Multiple Report Reasons**: 
  - Inappropriate content
  - Misleading information
  - Spam or scam
  - Offensive or harmful
  - Wrong category
  - Duplicate listing
  - Other
- **Additional Details**: Optional description field (max 500 characters)
- **Status Tracking**: Reports have status (pending, reviewed, resolved, dismissed)

## Database Schema

### Tables Created
1. **food_item_reviews**
   - `id` (UUID, Primary Key)
   - `food_item_id` (UUID, Foreign Key)
   - `user_id` (UUID, Foreign Key)
   - `rating` (INTEGER, 1-5)
   - `review_text` (TEXT, Optional)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)
   - Unique constraint on (food_item_id, user_id) - one review per user per item

2. **food_item_reports**
   - `id` (UUID, Primary Key)
   - `food_item_id` (UUID, Foreign Key)
   - `user_id` (UUID, Foreign Key)
   - `reason` (TEXT)
   - `description` (TEXT, Optional)
   - `status` (TEXT, Default: 'pending')
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

### Row Level Security (RLS)
- **Reviews**: Anyone can view, users can create/update/delete their own
- **Reports**: Users can only view and create their own reports

### Functions
- `get_food_item_rating(item_id)`: Returns average rating and total reviews
- `search_food_items_nearby()`: Updated to include average_rating and total_reviews

## Files Created/Modified

### New Files
1. `/src/components/ReviewModal.js` - Modal for rating and reviewing food items
2. `/src/components/ReportModal.js` - Modal for reporting food items
3. `/sql/reviews_and_reports.sql` - Complete SQL schema

### Modified Files
1. `/src/screens/HomeScreen.js` - Added three-dot menu and integrated modals

## Installation Steps

### 1. Run SQL in Supabase
Open your Supabase SQL Editor and run the file:
```
/sql/reviews_and_reports.sql
```

This will:
- Create the necessary tables
- Set up indexes for performance
- Enable Row Level Security
- Create policies for data access
- Update the search function to include ratings

### 2. Test the Feature
1. Build and run your app: `expo start`
2. Search for food items near you
3. Click the three-dot menu (⋮) on any food card
4. Try both "Rate & Review" and "Report" options

## UI/UX Features

### Three-Dot Menu
- Located in the top-right corner of each food card
- Opens a centered modal with two options
- Smooth fade animation

### Review Modal
- **Top Section**: Food item name and business
- **Rating Summary**: Large display of average rating with stars
- **Your Review Section**: 
  - Interactive star rating (tap to select)
  - Text area for review
  - Character counter (500 max)
  - Submit/Update button
- **All Reviews Section**: 
  - List of all reviews
  - Shows reviewer name, date, rating, and text
  - Scrollable list

### Report Modal
- **Food Item Info**: Shows which item is being reported
- **Reason Selection**: Radio buttons for predefined reasons
- **Additional Details**: Optional text area
- **Warning**: Disclaimer about false reports
- **Submit Button**: Sends report to database

### Rating Display on Cards
- Shows star rating (★★★★☆)
- Displays average rating number (e.g., 4.5)
- Shows total review count (e.g., "12 reviews")
- Only appears if item has reviews

## Technical Details

### State Management
- `menuVisible`: Tracks which food item's menu is open
- `reviewModalVisible`: Controls review modal visibility
- `reportModalVisible`: Controls report modal visibility
- `selectedFoodItem`: Stores the currently selected food item

### Data Flow
1. User clicks three-dot menu → `openMenu(item)`
2. User selects option → `openReviewModal(item)` or `openReportModal(item)`
3. Modal opens with food item data
4. User submits → Data saved to Supabase
5. Success → Modal closes, data refreshes (for reviews)

### Authentication
- Both features require authenticated users
- Uses `supabase.auth.getUser()` to get current user
- Shows error if user not logged in

## Future Enhancements (Optional)

1. **Admin Dashboard**: View and manage reports
2. **Review Moderation**: Flag inappropriate reviews
3. **Helpful Votes**: Let users mark reviews as helpful
4. **Image Upload**: Allow photos in reviews
5. **Response System**: Let business owners respond to reviews
6. **Sort/Filter Reviews**: By rating, date, helpfulness
7. **Review Statistics**: Show rating distribution (5★: 60%, 4★: 20%, etc.)
8. **Email Notifications**: Notify business owners of new reviews/reports

## Testing Checklist

- [ ] SQL runs without errors in Supabase
- [ ] Three-dot menu appears on food cards
- [ ] Menu opens when clicked
- [ ] Review modal opens and displays correctly
- [ ] Can submit a new review
- [ ] Can update existing review
- [ ] Rating appears on food card after submission
- [ ] Report modal opens and displays correctly
- [ ] Can submit a report
- [ ] All reviews display in review modal
- [ ] Authentication checks work properly
- [ ] Modals close properly
- [ ] Data persists after app reload

## Troubleshooting

### Reviews not appearing
- Check if SQL was run successfully
- Verify RLS policies are enabled
- Check browser/app console for errors

### Can't submit review/report
- Ensure user is authenticated
- Check Supabase logs for errors
- Verify foreign key constraints (food_item_id must exist)

### Rating not updating on card
- Check if `search_food_items_nearby` function was updated
- Verify the function returns `average_rating` and `total_reviews`
- Try refreshing the search

## Support
For issues or questions, check:
1. Supabase logs (Authentication & Database)
2. React Native debugger console
3. Network tab for API calls
