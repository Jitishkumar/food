# Supabase Database Structure

This folder contains all database-related files for the Food Discover app.

## Directory Structure

### `/migrations`
Contains all database schema changes in chronological order:
- `00_initial_schema.sql` - Initial database schema
- `01_inventory_tracking.sql` - Adds inventory tracking features
- `02_remembered_accounts.sql` - Adds account switching functionality
- `03_profile_trigger.sql` - Automatic profile creation trigger
- `04_fix_profile_creation.sql` - Profile creation fixes
- `05_fix_rls_policies.sql` - Row Level Security policies

### `/seeds`
Contains sample data for development and testing:
- `01_sample_data.sql` - Basic sample data
- `02_businesses_and_foods.sql` - Sample businesses and food items
- `03_easy_sample_data.sql` - Simplified sample data set

### `/functions`
Contains database functions and triggers (currently empty, will be used for future features)

## How to Apply Changes

1. **Apply Migrations:**
   ```bash
   # Run migrations in order
   cd supabase/migrations
   psql -f 00_initial_schema.sql
   psql -f 01_inventory_tracking.sql
   # ... and so on
   ```

2. **Load Sample Data:**
   ```bash
   cd supabase/seeds
   psql -f 01_sample_data.sql
   # Add more sample data as needed
   ```

## Development Guidelines

1. **New Features:**
   - Create a new migration file with the next available number
   - Use descriptive names for migration files
   - Include both "up" and "down" migrations when possible

2. **Sample Data:**
   - Keep sample data realistic and diverse
   - Include data that covers all feature scenarios
   - Maintain referential integrity