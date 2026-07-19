# Secure APK Build Guide for Production

## Overview
This guide will help you build a secure APK that's difficult to reverse-engineer and hack.

---

## 🔒 Security Layers

### Layer 1: Supabase Security (Already Implemented ✅)
Your app is already relatively secure because:
- ✅ **Row Level Security (RLS)** enabled on all tables
- ✅ **No API keys** exposed in code (Supabase uses anonymous key which is safe)
- ✅ **Authentication required** for sensitive operations
- ✅ **Server-side validation** through Supabase policies

### Layer 2: Code Obfuscation & Minification
React Native apps can be reverse-engineered, but we can make it much harder.

---

## 📋 Step-by-Step Secure Build Process

### Step 1: Environment Variables Security

**Current Issue:** Your `supabase-config.js` has hardcoded keys.

**Solution:** Use environment variables that don't get committed to Git.

1. **Install react-native-dotenv:**
```bash
npm install react-native-dotenv
```

2. **Create `.env` file** (add to `.gitignore`):
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. **Update `babel.config.js`:**
```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
        safe: false,
        allowUndefined: true,
      }]
    ]
  };
};
```

4. **Update `supabase-config.js`:**
```javascript
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = SUPABASE_URL;
const supabaseAnonKey = SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

5. **Add to `.gitignore`:**
```
.env
.env.local
.env.production
```

---

### Step 2: Enable ProGuard (Code Obfuscation for Android)

**What it does:** Shrinks, optimizes, and obfuscates your code.

1. **Edit `android/app/build.gradle`:**
```gradle
android {
    ...
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
    }
}
```

2. **Create `android/app/proguard-rules.pro`:**
```proguard
# Keep app code
-keep class com.yourapp.** { *; }

# Keep React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }

# Keep Supabase
-keep class io.supabase.** { *; }

# Remove logging in production
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}
```

---

### Step 3: Generate Signing Key

**Important:** This key is used to sign your APK. Keep it **SECRET**!

1. **Generate keystore:**
```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. **You'll be asked:**
   - Password (remember this!)
   - Name, Organization, City, State, Country

3. **Store keystore info in `android/gradle.properties`:**
```properties
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=your_keystore_password
MYAPP_RELEASE_KEY_PASSWORD=your_key_password
```

4. **Add to `.gitignore`:**
```
*.keystore
android/gradle.properties
```

5. **Update `android/app/build.gradle`:**
```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

---

### Step 4: Remove Debug Information

**Edit `android/app/build.gradle`:**
```gradle
android {
    ...
    buildTypes {
        release {
            ...
            debuggable false
            jniDebuggable false
            renderscriptDebuggable false
            zipAlignEnabled true
        }
    }
}
```

---

### Step 5: Enable Hermes Engine (Bytecode)

Hermes compiles JavaScript to bytecode, making it harder to reverse-engineer.

**Already enabled in Expo by default!** ✅

Verify in `app.json`:
```json
{
  "expo": {
    "jsEngine": "hermes"
  }
}
```

---

### Step 6: Build Release APK

**Option A: Using EAS Build (Recommended)**
```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure

# Build APK
eas build --platform android --profile production
```

**Option B: Local Build**
```bash
cd android
./gradlew assembleRelease
```

Your APK will be at:
`android/app/build/outputs/apk/release/app-release.apk`

---

### Step 7: Additional Security Measures

#### 7.1 SSL Pinning (Advanced)
Prevents man-in-the-middle attacks.

```bash
npm install react-native-ssl-pinning
```

#### 7.2 Root/Jailbreak Detection
```bash
npm install react-native-device-info
```

```javascript
import DeviceInfo from 'react-native-device-info';

// Check if device is rooted
const isRooted = await DeviceInfo.isRootedExperiment();
if (isRooted) {
  Alert.alert('Security Warning', 'This app cannot run on rooted devices');
}
```

#### 7.3 App Integrity Check
```bash
npm install react-native-app-auth
```

#### 7.4 Disable Console Logs in Production
Create `src/utils/logger.js`:
```javascript
const isDevelopment = __DEV__;

export const logger = {
  log: (...args) => isDevelopment && console.log(...args),
  error: (...args) => isDevelopment && console.error(...args),
  warn: (...args) => isDevelopment && console.warn(...args),
};
```

Replace all `console.log` with `logger.log`.

---

### Step 8: Secure Supabase Further

#### 8.1 Enable RLS on ALL Tables
Already done ✅

#### 8.2 Create API Rate Limiting
In Supabase Dashboard:
- Settings → API → Rate Limiting
- Set limits per IP address

#### 8.3 Enable Email Verification
Dashboard → Authentication → Email → Enable "Confirm email"

#### 8.4 Set up JWT Expiry
Dashboard → Settings → Auth
- JWT expiry: 3600 (1 hour)
- Refresh token expiry: 604800 (1 week)

---

## 🚀 Final Build Commands

### For Testing (Development Build)
```bash
npm run android
```

### For Production (Signed Release)
```bash
cd android
./gradlew assembleRelease
```

### For AAB (Google Play Store)
```bash
cd android
./gradlew bundleRelease
```

---

## 📱 Distribution Options

### Option 1: Direct APK Distribution
- Upload APK to your website
- Share via Firebase App Distribution
- Use TestFlight (iOS)

### Option 2: Google Play Store
- More secure
- Automatic updates
- Better user trust
- Requires developer account ($25 one-time)

### Option 3: Private Distribution
- Firebase App Distribution (Free)
- Beta testing before public release

---

## 🔐 Security Checklist Before Release

- [ ] Environment variables not hardcoded
- [ ] ProGuard enabled
- [ ] Code signed with release key
- [ ] Debug mode disabled
- [ ] Console logs removed/disabled
- [ ] Hermes engine enabled
- [ ] RLS policies tested
- [ ] API rate limiting enabled
- [ ] SSL/TLS enforced (Supabase does this)
- [ ] Authentication required for sensitive operations
- [ ] Test on real device
- [ ] Keystore backed up securely
- [ ] Version code incremented
- [ ] Change logs documented

---

## ⚠️ Important Security Notes

### What CAN'T Be 100% Protected:
1. **Supabase Anon Key** - This is meant to be public
2. **API URLs** - These are visible in network traffic
3. **JavaScript Code** - Can be deobfuscated with effort

### What CAN Be Protected:
1. **User data** - RLS policies ensure users only see their data
2. **Business logic** - Server-side validation in Supabase
3. **Sensitive operations** - Require authentication
4. **Payment info** - Never store in app, use payment gateways

### Your App's Security Strengths:
✅ **Supabase RLS** - Main line of defense
✅ **Authentication** - Required for sensitive operations
✅ **Server-side validation** - Can't be bypassed
✅ **No hardcoded secrets** - Using public keys only

---

## 🎯 Recommended Security Level for Your App

### Minimum (Good for MVP):
- ProGuard enabled
- Signed APK
- RLS enabled
- Authentication required

### Recommended (Production):
- All minimum items
- Environment variables
- Root detection
- Rate limiting
- Email verification

### Maximum (Enterprise):
- All recommended items
- SSL pinning
- App integrity checks
- Obfuscation tools
- Security audits

---

## 📚 Quick Commands Reference

```bash
# Install dependencies
npm install react-native-dotenv

# Generate keystore
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# Build release APK
cd android && ./gradlew assembleRelease

# Build AAB for Play Store
cd android && ./gradlew bundleRelease

# Test release build
adb install android/app/build/outputs/apk/release/app-release.apk
```

---

## 🔒 Final Thoughts

**Your app uses Supabase, which is inherently secure because:**
1. All validation happens server-side
2. RLS policies protect user data
3. Authentication is required
4. No sensitive data stored in app

**The Supabase anon key being visible is OK because:**
- It's designed to be public
- RLS policies protect the data
- Server validates everything
- Can't bypass authentication

**Focus on:**
1. ✅ Strong RLS policies (already done)
2. ✅ Code obfuscation (ProGuard)
3. ✅ Signed APK (release key)
4. ✅ Remove debug logs

This gives you **good security** without over-engineering!

---

## Need Help?

If you need more specific security for:
- Payment processing → Use payment gateway APIs
- Sensitive data → Encrypt before storing
- Advanced protection → Consider native modules

Your current setup is **secure enough** for most food discovery apps! 🎉
