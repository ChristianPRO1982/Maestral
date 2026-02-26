# Linux First-Pass Checklist (Ubuntu + VSCode + Codex)

Purpose: validate the local development/testing pipeline before feature work.

## A. Environment Validation

- [ ] Android Studio installed
- [ ] Android SDK and platform tools installed
- [ ] At least one Android Emulator image installed
- [ ] `adb` available in terminal

## B. Device Validation

- [ ] Emulator boots successfully
- [ ] Optional physical Android device recognized (`adb devices`)
- [ ] USB debugging enabled on physical device (if used)

## C. Build/Test Pipeline Validation (once project scaffold exists)

- [ ] `./gradlew tasks` runs
- [ ] `./gradlew testDebugUnitTest` runs
- [ ] `./gradlew assembleDebug` runs

## D. First Manual App Validation (once app scaffold exists)

- [ ] App launches on emulator
- [ ] Main screen renders without crash
- [ ] Basic logs visible for startup state

## Notes

- This checklist is intentionally minimal and should stay executable on Ubuntu only.
