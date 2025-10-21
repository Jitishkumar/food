# Setup Long-Lasting Sessions for Account Switching

Follow these steps to make sessions persist longer and avoid re-entering passwords.

## Step 1: Update Supabase Dashboard Settings (REQUIRED)

1. Go to your Supabase Dashboard:
   - URL: https://supabase.com/dashboard/project/sikuvuepkmuoxvrwvjyo

2. Navigate to: **Authentication** → **Settings**

3. Configure JWT Settings:
   - **JWT Expiry**: Change to `31536000` (1 year in seconds)
   - **Refresh Token Rotation**: Keep **ENABLED**
   - **Refresh Token Reuse Interval**: Set to `10` (seconds)

4. Configure Session Settings:
   - **Inactivity Timeout**: Set to `31536000` (1 year)
   - **Session Timeout**: Set to `31536000` (1 year)

5. Click **Save** at the bottom

## Step 2: Understanding How It Works Now

### When Account Switching Works:
- ✅ Tokens are valid → Instant switch, no password needed
- ✅ Supabase auto-refreshes tokens before they expire

### When Token Expires (rare):
- ❌ Token expired → User gets a friendly alert
- 📱 Alert shows: "Session expired for [email]. Please log in again."
- 🔐 User can re-login to restore the account

### Session Lifetime:
- **Before changes**: ~1 hour (default)
- **After changes**: ~1 year
- Sessions persist until:
  - User clicks "Logout"
  - User removes account from switcher
  - Token expires (very rare with 1 year timeout)

## Step 3: How Tokens Auto-Refresh

The app automatically refreshes tokens:
- Every time the app opens
- Before token expires
- When switching accounts
- Stored securely in AsyncStorage

## Step 4: User Experience

### Instagram-Like Behavior:
1. **Login once** → Account saved
2. **Switch anytime** → No password needed
3. **Add accounts** → Build your account list
4. **Remove accounts** → Long-press or use remove button
5. **Logout** → Only removes current session

### Account Switcher Features:
- 👤 Shows all saved accounts with avatars
- ✅ Marks current account
- 🔄 One-tap switching
- ➕ Add new accounts
- 🗑️ Remove accounts
- ⚡ Instant switching (when tokens valid)

## Troubleshooting

### If "Session Expired" appears:
1. This means the token is older than 1 year (very rare)
2. Simply log in again - the account will be restored
3. You won't need to re-enter password again for another year

### To test:
1. Log in with Account A
2. Add Account B
3. Switch between A and B → Should work instantly!
4. Close app and reopen → Still logged in!
5. Wait days/weeks → Still works!

## Security Notes

✅ **Secure Storage**: Tokens stored in encrypted AsyncStorage
✅ **No Passwords**: Only refresh tokens stored, never passwords
✅ **Auto-Refresh**: Tokens refresh before expiry
✅ **Revocable**: Users can logout or remove accounts anytime
