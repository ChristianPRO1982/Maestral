# Maestral — Technology Stack (V1)

## 1. Philosophy

Maestral V1 must be:

* Fully autonomous (no external server required)
* Offline-capable
* Lightweight and maintainable
* Focused on PDF display and real-time synchronization only
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

Architecture overview:

```
Tablet Master  <—— WebRTC DataChannel ——>  Tablet Slave
         (PWA)                             (PWA)
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
* Type safety (important for sync protocol)
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
* Offline startup
* Controlled asset caching

---

### 3.3 PDF Rendering

* **Mozilla PDF.js**

Used for:

* Rendering PDF pages
* Page navigation
* Zoom handling
* Reset view management

PDF rendering is fully client-side.

---

## 4. Real-Time Synchronization

### 4.1 Communication Protocol

* **WebRTC DataChannels**
* Peer-to-peer connection
* JSON-based message protocol

Reasons:

* No central server
* Low latency
* Reliable ordered delivery (configurable)

---

### 4.2 Signaling Strategy (Serverless)

WebRTC requires signaling (offer/answer exchange).

In V1, signaling is handled via:

* QR code exchange
* Manual pairing process

Flow:

1. Master generates SDP offer
2. Master displays QR
3. Slave scans and generates answer
4. Answer returned via QR or copy/paste
5. Connection established

No external signaling server is used.

---

### 4.3 Sync Message Protocol (Conceptual)

Messages are small JSON payloads.

Examples:

```json
{
  "type": "SET_PDF",
  "pdf_id": "uuid"
}
```

```json
{
  "type": "SET_PAGE",
  "page_index": 3
}
```

```json
{
  "type": "RESET_VIEW"
}
```

Only control signals are synchronized.
PDF files are stored locally on each device.

---

## 5. Local Storage

### 5.1 Metadata Storage

* **IndexedDB**
* Accessed through a lightweight wrapper (e.g., Dexie)

Used for:

* PDF metadata
* Playlist information
* Local settings
* Device role state

---

### 5.2 PDF File Storage

Handled via:

* File input (manual import)
* Stored as Blob references or persistent file handles (when available)

Each device stores its own PDF files.
Synchronization does NOT transfer PDFs.

---

## 6. Roles

### 6.1 Master

Responsible for:

* Selecting PDF
* Changing page
* Resetting zoom
* Broadcasting sync events

Only one Master per session.

---

### 6.2 Slave

Responsible for:

* Listening to sync events
* Applying page/zoom changes
* Rendering locally stored PDF

Slaves do not control navigation.

---

## 7. Network Assumptions

* Both tablets connected to same Wi-Fi network
* No Internet required
* No NAT traversal complexity (LAN only)
* No TURN server

The system is not designed for remote or Internet-based usage in V1.

---

## 8. Build & Deployment

* Built using Vite
* Static bundle output
* Deployable as static files
* Can be hosted:

  * Locally for development
  * Via simple static server
  * Or sideloaded via PWA install

No runtime backend required.

---

## 9. Explicit Non-Goals (V1)

* No cloud sync
* No multi-room orchestration
* No automatic PDF distribution
* No SEO optimization
* No remote access over Internet
* No complex update system

The focus is:
Stable PDF display + deterministic synchronization.

---

## 10. Why This Stack Is Maintainable

* No backend infrastructure
* No server runtime
* No database server
* Strictly client-side architecture
* Small surface area
* Clear separation of responsibilities
* Strong typing via TypeScript

Complexity is contained within:

* WebRTC pairing
* Sync state machine

Everything else remains standard frontend engineering.
