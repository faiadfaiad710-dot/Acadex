# Acadex Mobile APK

This Expo wrapper packages the deployed Acadex web app as an Android APK.

## Build APK

```bash
cd mobile-app
npm install
npx eas login
npx eas build -p android --profile preview
```

To point the APK at another deployment URL:

```bash
set EXPO_PUBLIC_ACADEX_URL=https://your-vercel-domain.vercel.app
npx eas build -p android --profile preview
```
