# Maestral — P2P Android WebRTC POC (V1)

## 1. Objective

Build a minimal Progressive Web App (PWA) to validate peer-to-peer communication between two Android devices using WebRTC DataChannels.

This POC must:

* Be installable as a PWA
* Work without Internet after installation
* Establish a direct P2P connection
* Allow both devices to send and receive:

  * `NEXT`
  * `PREV`
* Display connection status and received messages
* Contain no PDF rendering
* Contain no database
* Contain no UI complexity
* Contain no styling beyond basic layout

This POC validates technical feasibility only.

---

## 2. Technical Constraints

### 2.1 Hosting

* The PWA must be hosted on HTTPS.
* Any static hosting platform is acceptable (GitHub Pages, Netlify, Cloudflare Pages, etc.).
* After installation, both devices must function without Internet.

---

### 2.2 Stack

Minimal stack:

* Vite
* TypeScript
* No frontend framework (no React, no Svelte)
* Native WebRTC APIs
* PWA via Vite plugin (or equivalent)
* Service Worker for offline caching

No external backend.
No signaling server.
No STUN/TURN servers initially (LAN only).

---

## 3. Functional Requirements

### 3.1 Roles

This POC has no fixed roles.

Both devices must:

* Create an offer
* Accept an offer
* Create an answer
* Send commands
* Receive commands

Symmetrical behavior.

---

### 3.2 Connection Flow (Manual Signaling)

Since no server is used, signaling must be manual.

#### Device A — Create Offer

1. Press `Create Offer`
2. Generate RTCPeerConnection
3. Create DataChannel
4. Generate SDP offer
5. Display offer SDP in a large textarea
6. User copies offer to Device B

---

#### Device B — Accept Offer

1. Paste offer SDP into textarea
2. Press `Create Answer`
3. Create RTCPeerConnection
4. Set remote description (offer)
5. Create SDP answer
6. Display answer SDP
7. User copies answer back to Device A

---

#### Device A — Finalize

1. Paste answer SDP
2. Press `Connect`
3. Set remote description (answer)
4. DataChannel opens

Connection state must update visually:

* `Disconnected`
* `Connecting`
* `Connected`

---

## 4. DataChannel Behavior

### 4.1 Channel Configuration

* Ordered delivery
* Reliable
* No special configuration required

---

### 4.2 Message Format

Messages must be JSON strings.

Allowed messages:

```json
{
  "type": "NEXT"
}
```

```json
{
  "type": "PREV"
}
```

No additional payload.

---

### 4.3 On Receive

When a message is received:

* Append it to a visible log
* Increment a counter
* Show timestamp

Example log entry:

```
[21:14:03] Received: NEXT
```

---

## 5. UI Requirements

Minimal layout:

### Section 1 — Connection

* Button: `Create Offer`
* Textarea: Offer SDP (readonly)
* Textarea: Paste Offer
* Button: `Create Answer`
* Textarea: Answer SDP (readonly)
* Textarea: Paste Answer
* Button: `Connect`

---

### Section 2 — Status

* Connection status label
* DataChannel status label

---

### Section 3 — Controls

* Button: `NEXT`
* Button: `PREV`

Buttons must be disabled until connection is established.

---

### Section 4 — Log

* Scrollable message log
* Display received and sent messages

---

## 6. PWA Requirements

### 6.1 Manifest

* Name: "Maestral P2P Test"
* Display: standalone
* Orientation: portrait
* Background color: neutral
* Icon: placeholder acceptable

---

### 6.2 Service Worker

* Cache all static assets
* Enable offline startup
* No runtime caching logic needed

---

## 7. Non-Goals

This POC must NOT include:

* PDF rendering
* IndexedDB
* Playlist logic
* Role system (Master/Slave)
* Reconnection logic
* ICE server infrastructure
* Multi-device support
* UI polish
* Error recovery flows
* Production hardening

---

## 8. Validation Checklist

The POC is considered successful if:

* Both Android devices install the PWA
* Devices connect over local Wi-Fi
* Internet can be disabled after installation
* NEXT from Device A appears instantly on Device B
* PREV from Device B appears instantly on Device A
* Connection remains stable for at least 10 minutes
* Screen on/off does not immediately break the connection

---

## 9. Known Risks

* Some Wi-Fi networks may restrict peer-to-peer traffic
* Certain Android versions may suspend background WebRTC
* Manual SDP exchange is error-prone but acceptable for POC

---

## 10. Success Criteria for Moving to Architecture Phase

If this POC works reliably:

* WebRTC DataChannel over LAN is validated
* Serverless architecture is viable
* Maestral can safely proceed with P2P sync engine design

If this POC fails:

* Re-evaluate need for minimal signaling server
* Consider fallback architecture

---

End of document.
