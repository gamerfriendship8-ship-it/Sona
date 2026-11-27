# Building the SONA Android APK

This folder (`/android`) contains the native Kotlin + Jetpack Compose Android Studio project for **SONA**, configured for Android 8.0+ (API 26) through Android 15 (API 35).

## 1. Prerequisites
- **Android Studio** (Ladybug 2024.2+ or newer) with **Android SDK 35** and **JDK 17**.
- Or the Gradle CLI with Android SDK installed (`ANDROID_HOME` configured).

## 2. Configure Your Backend URL
In `MainActivity.kt` / `SonaAssistantCore.kt`, set `SONA_API_BASE_URL` to your deployed SONA Express backend URL (never embed raw API keys inside the Android APK).

## 3. Build a Debug APK (Quick Testing)
1. Open the `/android` folder in Android Studio, or run from terminal inside `/android`:
   ```bash
   ./gradlew assembleDebug
   ```
2. Your APK will be generated at:
   `android/app/build/outputs/apk/debug/app-debug.apk`
3. Install on a connected Android phone with USB Debugging enabled:
   ```bash
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```

## 4. Build a Signed Release APK (Distribution)
1. Generate a signing keystore (one-time):
   ```bash
   keytool -genkey -v -keystore sona-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias sona
   ```
2. Configure signing in Android Studio via **Build > Generate Signed App Bundle / APK > APK**, or add a `signingConfigs` block to `android/app/build.gradle.kts` referencing environment variables.
3. Run:
   ```bash
   ./gradlew assembleRelease
   ```
4. The signed release APK will be output at:
   `android/app/build/outputs/apk/release/app-release.apk`

## 5. Android Permissions & Privacy Notes
- **CALL_PHONE & SEND_SMS**: Only requested when Boss explicitly confirms a call or SMS action in the confirmation dialog.
- **Wi-Fi & Hotspot (Android 10+)**: On Android 10+, third-party apps cannot silently toggle system Wi-Fi or Hotspot radios in the background; `SonaAssistantCore` checks OS API level and safely launches `Settings.Panel.ACTION_WIFI` or the Tethering settings screen when OS restriction applies.
- **No Cloud Storage of Private Logs**: Conversation history and Boss/Assistant preferences remain local unless explicitly sent to your configured backend.
