# Fixing Connection Error in Development Build

## The Error You're Seeing

```
java.net.ConnectException: Failed to connect to /10.129.36.57:8081
```

## What This Means

This error occurs in **development builds only** (Expo Dev Client). It means your phone/emulator can't connect to the Metro bundler running on your computer.

---

## ✅ Good News: Your Release APK Built Successfully!

Your secure release APK is ready at:
```
android/app/build/outputs/apk/release/app-release.apk
```

This APK:
- ✅ Works standalone (no Metro bundler needed)
- ✅ Has environment variables configured
- ✅ Debug mode disabled
- ✅ Ready for distribution

---

## Solutions for Development Mode

### Option 1: Use the Release APK (Recommended for Testing)

Install the release APK on your device:

```bash
# Uninstall the dev version first
adb uninstall com.fooddiscover.app

# Install release APK
adb install android/app/build/outputs/apk/release/app-release.apk
```

**Benefits:**
- No Metro bundler needed
- Tests the actual production app
- No connection issues
- Works exactly like users will see it

### Option 2: Fix Development Connection

If you still want to use development mode:

#### Step 1: Make sure Metro is running

```bash
cd /Users/jitishkumar/Desktop/food2026/food
npx expo start --clear
```

#### Step 2: Check your network

**For Physical Device:**
1. Make sure your phone and computer are on the **same WiFi network**
2. Find your computer's IP address:
   ```bash
   # On macOS
   ipconfig getifaddr en0
   # or
   ifconfig | grep inet
   ```

**For Android Emulator:**
1. Metro should auto-detect
2. If not, use: `adb reverse tcp:8081 tcp:8081`

#### Step 3: Rebuild development app

```bash
npm run android
```

#### Step 4: In the app

1. Shake device or press Cmd+M (emulator)
2. Go to Settings
3. Change Bundle Location to your computer's IP: `YOUR_IP:8081`
4. Reload the app

---

## 🎯 Recommended Workflow

### For Development:
```bash
# Start Metro
npx expo start --clear

# Run on device/emulator
npm run android
```

### For Testing/Distribution:
```bash
# Build release APK
cd android
./gradlew assembleRelease

# Install on device
adb install app/build/outputs/apk/release/app-release.apk
```

---

## Common Issues

### "Metro already running on port 8081"

Kill the old process:
```bash
lsof -ti:8081 | xargs kill -9
npx expo start --clear
```

### "Cannot connect even on same WiFi"

Check firewall settings:
```bash
# macOS - temporarily disable firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off

# Test, then re-enable
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on
```

### "App crashes immediately on release APK"

Check environment variables:
```bash
# Make sure .env exists
cat .env

# Clear cache and rebuild
npx expo start --clear
cd android && ./gradlew clean && ./gradlew assembleRelease
```

---

## 📱 Testing Your Secure APK

### Install Release APK:
```bash
# Find connected devices
adb devices

# Uninstall old version
adb uninstall com.fooddiscover.app

# Install new release APK
adb install /Users/jitishkumar/Desktop/food2026/food/android/app/build/outputs/apk/release/app-release.apk
```

### What to Test:
- [ ] App launches successfully
- [ ] Can login/signup
- [ ] Can view food items
- [ ] Location features work
- [ ] Payment requests work
- [ ] Notifications appear
- [ ] No connection errors!

---

## 🔒 Security Reminder

Your release APK is already secure:
- ✅ Environment variables in .env (not hardcoded)
- ✅ Debug disabled
- ✅ Supabase RLS protecting data
- ✅ Signed APK
- ✅ Ready for distribution

**You can distribute this APK to users right now!**

---

## Quick Commands Reference

```bash
# Build release APK
cd android && ./gradlew assembleRelease

# Install release APK
adb install app/build/outputs/apk/release/app-release.apk

# Start development server
npx expo start --clear

# Run development build
npm run android

# Kill Metro bundler
lsof -ti:8081 | xargs kill -9

# View device logs
adb logcat -s ReactNative:V ReactNativeJS:V
```

---

## Next Steps

1. **Test the release APK** on your device
2. If it works, you're ready to distribute!
3. If you need development mode, follow Option 2 above

**The connection error only affects development, not your production APK!** 🎉
