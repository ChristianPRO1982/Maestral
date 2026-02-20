# Maestral — Technology Stack (V1)

## 1. Philosophy

Maestral V1 must be:

* Fully autonomous (no external server required)
* Offline-capable for local library usage
* Lightweight and maintainable
* Focused on score display (PDF + image songs), setlists, and real-time synchronization
* Designed for local Wi-Fi usage (LAN only)

The goal is simplicity and robustness over feature richness.

---

## 2. Global Architecture

Maestral is a **Progressive Web Application (PWA)** running directly in modern browsers on Android tablets.

Communication between devices is:

* Peer-to-peer
* Real-time
* Serverless
* Limited to local network usage

V1 supports two synchronization topologies:

### 2.1 Solo Mode (Dual Screen)

Two tablets are paired.
Both remain manually navigable and keep mirrored page state.

```
Tablet A  <—— WebRTC DataChannel ——>  Tablet B
 (PWA)                                 (PWA)
```

### 2.2 Choir Mode (Master + Followers)

One master coordinates one or more followers.
Each follower has an independent link to the master.

```
Follower 1  <—— WebRTC DataChannel ——>
Follower 2  <—— WebRTC DataChannel ——>  Master
Follower N  <—— WebRTC DataChannel ——>
```

No backend server.
No cloud dependency.
No database server.

---

## 3. Frontend Stack

### 3.1 Core Framework

* **React**
* **TypeScript**
* **Vite** (build tool)

Rationale:

* Strong ecosystem
* Type safety for sync state
* Fast dev cycle
* Easy maintainability

---

### 3.2 PWA Layer

* Service Worker
* Web App Manifest
* Offline caching via Cache API

Capabilities:

* Installable on Android
* Full-screen mode
* Offline startup for local content
* Controlled asset caching

---

### 3.3 Score Rendering

* **Mozilla PDF.js** for PDF songs
* Native browser image rendering for JPG/PNG songs

Used for:

* Rendering one page/image at a time
* Discrete page navigation
* Zoom handling
* Reset view management

Rendering is fully client-side.

---

## 4. Real-Time Synchronization

### 4.1 Communication Protocol

* **WebRTC DataChannels**
* Peer-to-peer links
* JSON-based message protocol

Reasons:

* No central server
* Low latency on LAN
* Reliable ordered delivery when needed

---

### 4.2 Signaling Strategy (Serverless)

WebRTC requires signaling (offer/answer exchange).

In V1, signaling is handled via:

* QR code exchange
* Manual token / copy-paste fallback

No external signaling server is used.

---

### 4.3 Sync Semantics by Mode

#### Solo Mode

* Page changes from either device are synchronized to the other.
* On temporary disconnect, both devices continue locally.
* On reconnect, the most recently changed page becomes shared state.

#### Choir Mode

* Master controls song selection and page reference state.
* Followers in **Follow** mode track master page changes.
* Followers in **Free** mode navigate locally and are not forced by master page turns.
* Song changes always take priority and switch all followers to the current song.
* During rapid page changes, final state is prioritized over replaying every intermediate page.

---

### 4.4 Synchronization Payload Scope

* Control events are synchronized in all modes (session, song, page, mode/state).
* In Choir Mode, song content can be streamed for temporary viewing during the active session.
* Streamed content is view-only and non-exportable.
* Session termination invalidates the token and clears streamed content.

---

## 5. Local Storage

### 5.1 Metadata Storage

* **IndexedDB**
* Accessed through a lightweight wrapper (e.g., Dexie)

Used for:

* Song metadata (PDF and image-based songs)
* Setlists
* Local settings
* Session token persistence for automatic reconnection
* Follower mode preference state (Follow / Free)

---

### 5.2 Local File Storage

Handled via:

* Manual file import
* Blob references or persistent file handles (when available)

Each device stores its own local library.
No permanent cross-device file synchronization is required.

---

## 6. Roles and Control Model

### 6.1 Solo Mode

* Two paired devices can both trigger manual page turns.
* A primary device may host Bluetooth pedal input.
* A page-leader parity setting (odd/even) defines complementary page layout.

### 6.2 Choir Master

Responsible for:

* Starting and ending session
* Sharing join QR/token
* Selecting songs
* Changing pages
* Seeing connected follower count

The master has no per-follower permission system in V1.

### 6.3 Choir Follower

Responsible for:

* Joining via QR or token
* Tracking connection state
* Toggling Follow / Free
* Navigating locally when in Free mode or during disconnection
* Automatic reconnection using stored session token

---

## 7. Network Assumptions

* Devices are connected to the same local Wi-Fi network
* No Internet dependency for core operation
* LAN-first behavior (not designed for remote Internet usage in V1)
* No TURN infrastructure required for the primary V1 scope

---

## 8. Build & Deployment

* Built using Vite
* Static bundle output
* Deployable as static files
* Can be hosted:

  * Locally for development
  * Via a simple static server
  * Via PWA install flow on devices

No runtime backend required.

---

## 9. Explicit Non-Goals (V1)

* No cloud account system
* No remote Internet sessions
* No annotation or score editing features
* No permanent streamed-file export to followers
* No advanced orchestration beyond a single local session scope
* No complex update infrastructure

---

## 10. Why This Stack Is Maintainable

* No backend infrastructure
* No server runtime
* No database server
* Strictly client-side architecture
* Small and explicit synchronization surface
* Clear separation between UI behavior and sync transport
* Strong typing via TypeScript

Complexity is concentrated in:

* WebRTC pairing
* Reconnection state handling
* Deterministic page/song state convergence
