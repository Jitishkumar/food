# Project Structure

This document describes the organized file structure of the Food Discover app.

## Directory Structure

```
food/
├── src/                          # Source code directory
│   ├── components/               # Reusable UI components
│   │   ├── AccountSwitcher.js   # Account switching component
│   │   └── Sidebar.js           # Navigation sidebar component
│   │
│   ├── screens/                 # Screen components
│   │   ├── AddBusinessScreen.js
│   │   ├── AddFoodItemScreen.js
│   │   ├── BusinessDetailScreen.js
│   │   ├── CategoriesScreen.js
│   │   ├── HomeScreen.js
│   │   ├── LoginScreen.js
│   │   ├── ManageBusinessScreen.js
│   │   ├── NearbyScreen.js
│   │   ├── OwnerDashboard.js
│   │   ├── OwnerReviewsScreen.js
│   │   ├── ProfileScreen.js
│   │   ├── RegisterScreen.js
│   │   └── SpecialFoodsScreen.js
│   │
│   └── utils/                   # Utility functions
│       ├── AccountManager.js    # Account management utilities
│       └── ClearOldAccounts.js  # Account cleanup utilities
│
├── supabase/                    # Supabase-related files
│   ├── migrations/              # Database migrations
│   ├── seeds/                   # Database seed data
│   ├── functions/               # Edge functions
│   ├── COMPLETE_RESET.sql       # Complete database reset script
│   ├── RESET_PROFILES_TABLE.sql # Profile table reset script
│   ├── alternative-fix-trigger.sql
│   ├── another.sql
│   ├── fix-registration.sql
│   ├── fix-rls-final.sql
│   └── increase-session-timeout.sql
│
├── readme/                      # Documentation files
│   ├── README.md                # Main project documentation
│   ├── ACCOUNT_SWITCHING_WORKING.md
│   ├── APP_FLOW.md
│   ├── DISABLE_EMAIL_CONFIRMATION.md
│   ├── FINAL_FIX_TRIGGER.md
│   ├── FINAL_SETUP.md
│   ├── FIXED_AUTH_FLOW.md
│   ├── HOW_TO_ADD_SAMPLE_DATA.md
│   ├── PROJECT_SUMMARY.md
│   ├── QUICKSTART.md
│   ├── SETUP_LONG_SESSIONS.md
│   └── STARTUP_CHECKLIST.md
│
├── assets/                      # Static assets (images, fonts, etc.)
├── android/                     # Android native code
├── ios/                         # iOS native code
├── node_modules/                # Dependencies
│
├── App.js                       # Root application component
├── AppNavigator.js              # Navigation configuration
├── supabase-config.js           # Supabase client configuration
├── app.json                     # Expo configuration
├── package.json                 # NPM dependencies
├── babel.config.js              # Babel configuration
├── metro.config.js              # Metro bundler configuration
└── index.js                     # Entry point
```

## Import Path Changes

After the reorganization, import paths have been updated as follows:

### From Root Files (App.js, AppNavigator.js)
- Screens: `'./src/screens/ScreenName'`
- Components: `'./src/components/ComponentName'`
- Utils: `'./src/utils/UtilityName'`

### From Screen Files (src/screens/*.js)
- Supabase config: `'../../supabase-config'`
- Components: `'../components/ComponentName'`
- Utils: `'../utils/UtilityName'`
- Other screens: `'./OtherScreen'`

### From Component Files (src/components/*.js)
- Supabase config: `'../../supabase-config'`
- Utils: `'../utils/UtilityName'`

## Benefits of This Structure

1. **Better Organization**: Related files are grouped together
2. **Easier Navigation**: Clear separation of concerns
3. **Scalability**: Easy to add new screens, components, or utilities
4. **Maintainability**: Easier to find and update files
5. **Clean Root**: Root directory is less cluttered
6. **Documentation**: All docs in one place

## Key Files

- **App.js**: Main application entry point, handles authentication state
- **AppNavigator.js**: Navigation configuration with custom tab bar
- **supabase-config.js**: Supabase client setup and configuration
- **src/utils/AccountManager.js**: Multi-account management logic
- **src/components/Sidebar.js**: Main navigation sidebar
