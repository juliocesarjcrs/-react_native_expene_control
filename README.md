# React Native Expense Control

## How to Run the Project

### 1. Install Dependencies

```sh
npm install
```

### 2. Run Locally (Development)

Start the Expo development server:

```sh
npm start
```

or

```sh
expo start
```

Scan the QR code with Expo Go on your mobile device.

---

### 3. Run Tests

To run all tests:

```sh
npm run test
```

---

### 4. Build for Production (Android)

**Using EAS Build (Cloud):**

```sh
eas build --platform android --profile preview
```

- Download the APK from the Expo dashboard after the build completes.

**Using EAS Build (Local, requires Android SDK):**

```sh
eas build --platform android --profile preview --local
```

- The APK will be generated in the `dist` folder.

---

## How to Update Expo SDK

1. **Check the latest Expo SDK version:**  
   [Expo SDK Releases](https://blog.expo.dev/expo-sdk-versions-343e4a6e1e1a)

2. **Upgrade your project:**

   ```sh
   npx expo upgrade
   ```

   Follow the prompts to update dependencies.

3. **Update dependencies manually if needed:**  
   Check for any additional packages that require updates.

4. **Test your app:**  
   Run the app locally and ensure everything works as expected.

---

## Useful Commands

- **Clear cache:**
  ```sh
  npm run clear:cache
  ```
- **Lint:**
  ```sh
  npm run lint
  ```
- **Run on Android (Expo Go):**
  ```sh
  npm run android
  ```
- **Run on Web:**
  ```sh
  npm run web
  ```

---
