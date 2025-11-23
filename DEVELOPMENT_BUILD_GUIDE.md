# Development Build Setup - AlphaFit AI

## ✅ Completed Setup

### Packages Installed
- `@react-native-google-signin/google-signin` - Native Google Sign-In
- `expo-dev-client` - Development build support
- `eas-cli` - Build tools

### Files Created/Modified
- `services/nativeGoogleSignIn.ts` - Native Google Sign-In service
- `app.json` - Added native plugins
- `eas.json` - Build configuration
- `services/userService.ts` - Added `authenticateUser()` method
- `app/onboarding/login.tsx` - Updated to use native Google Sign-In

## 🚀 Two Ways to Build & Test

### Option 1: EAS Cloud Build (Currently Running)
**Status:** Build in progress at https://expo.dev/accounts/alpha_fit/projects/AlphaFit_AI/builds/

```bash
# Wait for build to complete (5-15 minutes)
# Download APK from Expo website
# Install on your Android device
```

**Advantages:**
- No local setup needed
- Builds on cloud servers
- Get shareable APK link

### Option 2: Local Prebuild (Recommended for Development)
**Faster for testing and iteration!**

```bash
cd "y:\AlphaFit ai\αlphαFit_app"

# Generate native android/ folder
npx expo prebuild --clean

# Connect Android device via USB or start emulator
# Then run:
npx expo run:android
```

**Advantages:**
- Much faster (builds in 2-3 minutes)
- Instant testing after code changes
- Better for debugging
- No internet upload/download needed

## 📱 What You'll Get

### Native Google Sign-In Features
✅ **Native account picker** - Shows all Google accounts on device  
✅ **No web redirect** - Pure native experience  
✅ **No OAuth consent screen errors** - Bypasses browser limitations  
✅ **Faster authentication** - Direct device integration  
✅ **Works offline** - Can select account without internet  

### How It Works
1. User taps "Continue with Google"
2. Native Android account picker appears (bottom sheet)
3. User selects account
4. Gets Firebase ID token
5. Authenticates with your backend
6. Routes to onboarding or home screen

## 🔧 Backend Integration

The app now calls:
```typescript
POST /api/auth/firebase
Body: { idToken: "firebase-id-token" }
Response: { userId, needsOnboarding, token }
```

Make sure your Spring Boot backend has this endpoint configured!

## 🐛 Troubleshooting

### Build Errors
If EAS build fails, check:
- https://expo.dev/accounts/alpha_fit/projects/AlphaFit_AI/builds/
- Look for dependency conflicts
- Ensure all packages are compatible

### Local Build Issues
```bash
# Clear cache and rebuild
npx expo prebuild --clean
cd android
./gradlew clean
cd ..
npx expo run:android
```

### TypeScript Errors
The `@react-native-google-signin` error in `app.json` is normal - it resolves after native build completes.

## 📚 Next Steps

1. **Wait for EAS build** OR **run local prebuild**
2. **Install APK** on your Android device
3. **Test native Google Sign-In** with account picker
4. **Verify backend authentication** works
5. **Test onboarding flow** for new users
6. **Test direct login** for existing users

## 🎯 Development Workflow

For fastest iteration:
1. Use local prebuild once: `npx expo prebuild --clean`
2. Make code changes
3. Run: `npx expo run:android` (rebuilds in ~2 min)
4. Test immediately on device

For production/sharing:
- Use EAS build to create production APK
- Share link with testers
- Submit to Play Store

## 📞 Support

If you encounter issues:
- Check EAS build logs
- Verify Firebase config
- Ensure backend is running (localhost:8080)
- Test Firebase auth independently
