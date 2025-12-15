# React Native Expense Control

## How to Run the Project

### 1. Install Dependencies

```sh
npm install
```

---

### 2. Run Locally (Development)

Start the Expo development server:

```sh
npm start
```

or

```sh
expo start
```

Scan the QR code with **Expo Go** on your Android device (must be on the same Wi-Fi network).

---

### 3. Run Tests

To run all tests:

```sh
npm run test
```

---

### 4. Build for Production (Android)

#### Using EAS Build (Cloud)

```sh
eas build --platform android --profile preview
```

- Download the APK from the Expo dashboard after the build completes.

#### Using EAS Build (Local – requires Android SDK)

```sh
eas build --platform android --profile preview --local
```

- The APK will be generated in the `dist` folder.

---

## Validate Dependencies & Update Libraries

To avoid version mismatches and build failures, always validate dependencies before publishing or building.

### 1. Validate Installed Dependencies

Run **Expo Doctor** to check compatibility with the current Expo SDK:

```sh
npx expo-doctor
```

Check which dependencies are out of sync:

```sh
npx expo install --check
```

Automatically fix incompatible versions:

```sh
npx expo install --fix
```

> ⚠️ Always prefer `expo install` over `npm install` for Expo-related packages.  
> It installs versions officially supported by your Expo SDK.

---

### 2. Update Specific Libraries Safely

To update a dependency while keeping Expo compatibility:

```sh
npx expo install <package-name>@latest
```

Example:

```sh
npx expo install react-native-reanimated@latest
```

---

### 3. Clean & Reinstall After Updates

After upgrading or fixing dependencies, perform a clean reinstall:

```sh
rm -rf node_modules
rm package-lock.json
npm cache clean --force
npm install
npx expo start --clear
```

This prevents Metro cache issues and corrupted installs.

---

### 4. Dependency Checklist Before Build

- `expo`, `react`, and `react-native` versions match the Expo SDK.
- Only one lockfile exists (`package-lock.json` or `yarn.lock`).
- No native-only libraries are used if running only with Expo Go.
- `npx expo-doctor` reports no errors.

---

## How to Update Expo SDK

1. Check the latest Expo SDK version:  
   https://blog.expo.dev/expo-sdk-versions-343e4a6e1e1a

2. Upgrade the project:

```sh
npx expo upgrade
```

3. Fix dependency versions after upgrade:

```sh
npx expo install --fix
npx expo-doctor
```

4. Test the app locally using Expo Go.

---

## Useful Commands

- **Clear cache**
```sh
npm run clear:cache
```

- **Lint**
```sh
npm run lint
```

- **Run on Android (Expo Go)**
```sh
npm run android
```

- **Run on Web**
```sh
npm run web
```

---
