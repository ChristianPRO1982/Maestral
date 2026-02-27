# Maestral — Tech Stack V2 (Android Native)

This document defines the technical baseline for implementing `docs/PRODUCT_SPEC_V2.md`.

---

## 1. Platform Baseline

- Target: Android native app
- Primary devices: Android tablets
- Language: Kotlin
- UI toolkit: Jetpack Compose (Material 3)
- Build system: Gradle (Kotlin DSL)
- IDE: Android Studio (with VSCode/Codex as assistant workflow)

---

## 2. Android Configuration Targets

- `minSdk`: 29 (Android 10)
- `targetSdk`: latest stable at implementation time
- Orientation target: portrait-first (landscape support can be added where needed)

Rationale:
- Modern API surface for file access, lifecycle, and network behavior.
- Reduces compatibility complexity for first production-ready Android version.

---

## 3. App Architecture

- Pattern: MVVM
- State model: unidirectional state flow (UI state + events)
- Concurrency: Kotlin Coroutines + Flow
- Dependency injection: Hilt
- Navigation: Navigation Compose

High-level layers:
- `ui/`: screens + compose components
- `domain/`: business rules/use cases (Solo/Choir rules)
- `data/`: storage + network/session transport adapters
- `core/`: shared utilities (time, ids, serialization, logging)

---

## 4. Storage and Persistence

- Local relational data: Room (songs, setlists, app metadata)
- Key-value/session preferences: DataStore
- Cached score files: app-private storage (scoped storage compliant)

Persistence expectations:
- Offline-first startup
- Fast recovery of local library and setlists
- Safe persistence of reconnect/session metadata

---

## 5. Score Rendering

- PDF rendering: Android `PdfRenderer` (initial scope)
- Image rendering: Coil (JPEG/PNG)

Rules aligned with product spec:
- Page-based navigation only
- No PDF editing
- No annotation features

---

## 6. Device-to-Device Sync (V2 Baseline)

Transport baseline:
- Google Nearby Connections API (`P2P_STAR`)

Session behavior:
- Master creates session
- Followers join via short token and/or QR payload
- Local network/offline usage supported (no Internet required for core session)

Functional sync messages:
- Page change
- Song change
- Follow/Free mode updates
- Session lifecycle events (join, leave, end, reconnect)

---

## 7. Optional Device Integrations

- QR scanning: ML Kit Barcode Scanning (or CameraX + analyzer equivalent)
- Bluetooth pedal support: optional, deferred behind stable core sync

---

## 8. Testing Stack

- Unit tests: JUnit
- Flow/coroutines testing: kotlinx-coroutines-test
- Instrumented UI tests: AndroidX Test + Espresso/Compose UI Test
- Manual validation: Linux + Android Emulator + physical tablet pass

Test layers:
- Domain rule tests (priority and edge cases)
- Transport/session state tests
- UI smoke tests for critical flows

---

## 9. CI/CD Baseline (when project is scaffolded)

Planned commands:
- `./gradlew lint`
- `./gradlew testDebugUnitTest`
- `./gradlew connectedDebugAndroidTest` (when emulator runner is available)
- `./gradlew assembleDebug`

---

## 10. Explicit Non-Goals (Stack Level)

- No iOS implementation
- No desktop implementation
- No web/PWA runtime as production target
- No cloud-mandatory backend for core local usage
