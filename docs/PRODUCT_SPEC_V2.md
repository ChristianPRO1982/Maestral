# Maestral — Product Specification V2 (Android Native)

Tagline: *Where voices move as one.*

---

# 1. Product Vision

Maestral is an Android digital music stand app for choirs and musicians.

It enables synchronized score display across multiple Android devices while remaining simple, reliable, and performance-focused.

Maestral does not edit scores.
Users prepare final PDFs/images outside the app.

The interface must remain minimal.
Music remains central.

---

# 2. Platform Scope (V2)

## 2.1 Target Platform

- Android app (native)
- Android tablets are the primary target
- Android phones are secondary/compatible where feasible

## 2.2 Runtime Principles

- Local-first behavior
- Core usage must work without Internet once app is installed
- Device-to-device sync is local network based (LAN/hotspot)

## 2.3 Out of Platform Scope

- iOS app
- Desktop app
- Browser/PWA as primary runtime

---

# 3. Core Modes

Maestral supports two primary modes:

1. Solo Mode (Dual Screen)
2. Choir Mode (Master + Followers)

---

# 4. Global Features (All Modes)

## 4.1 Library Management

Users can:

- Import PDF files
- Import image files (JPG / PNG)

Rules:

- A PDF equals one Song
- PDF pages cannot be reordered
- PDF pages cannot be excluded
- PDFs are prepared externally

For image-based songs:

- Multiple images can be grouped into one Song
- Images within a Song can be reordered
- Images cannot be cropped or edited inside Maestral

Users can:

- Rename songs
- Delete songs

## 4.2 Setlists

Users can:

- Create a setlist
- Add songs to a setlist
- Reorder songs in a setlist
- Remove songs from a setlist
- Launch a setlist
- Move to next song

## 4.3 Page Navigation

Navigation is page-based only:

- One page displayed at a time
- Discrete page transitions
- No continuous page scrolling

Users can:

- Next page
- Previous page
- Optional jump to first/last page

Zooming:

- Zoom within page is allowed
- Panning inside zoomed page is allowed
- Zoom cannot trigger page change

## 4.4 Performance Expectations

During songs:

- Page transitions should occur in about 1 second
- Small delay is acceptable
- Multi-second delays are unacceptable

Between songs:

- Short loading time is acceptable

---

# 5. Solo Mode (Dual Screen)

## 5.1 Purpose

Designed for musicians using one or two devices as a digital open book.

## 5.2 Single Device Behavior

If one device is active:

- Device displays all pages sequentially
- Standard page-by-page navigation
- No pairing logic

## 5.3 Dual Device Behavior

When two devices are paired:

- Both devices have equal manual navigation authority
- Bluetooth pedal is connected to one device only (Primary)
- Either device can change page
- Page change on one device is reflected on the other

The behavior should mimic a physical open score.

## 5.4 Page Distribution

One device is designated as Page Leader for layout parity.

Page Leader chooses:

- Odd pages
OR
- Even pages

The other device displays complementary pages.

Examples:

- Leader page 1 -> other page 2
- Leader page 3 -> other page 4
- Leader page 2 -> other page 1
- Leader page 4 -> other page 3

## 5.5 Last Page Edge Case

If final page has no complement:

- Opposite screen shows neutral empty page
- Layout remains stable (no shifting/resizing)

---

# 6. Choir Mode — Master

## 6.1 Session Management

Master can:

- Start session
- Display QR code or manual token for join
- See connected follower count
- End session

No per-user permission system in V2.

## 6.2 Song Control

Master can:

- Select song
- Next song
- Previous song

When Master changes song:

- All followers switch to same song

## 6.3 Page Control

Master can:

- Change page
- See current page number

Master page changes do not override followers in Free Mode.

---

# 7. Choir Mode — Follower

## 7.1 Joining

Followers can:

- Join via QR or manual token
- View connection state
- Auto-reconnect on connection loss

## 7.2 Follower Page Modes

### Follow Mode

- Follower page tracks Master page automatically

### Free Mode

- Follower navigates independently
- Master page turns do not force follower page
- Preference remains respected

Rule:

- Song changes from Master always override follower local song/page context

## 7.3 Follower Navigation

Followers can:

- Navigate page by page
- Zoom/pan within page

No continuous page scroll.

---

# 8. Reconnection and Failure Behavior

## 8.1 Solo — Temporary Loss

- Both devices keep operating
- Current page remains visible
- Subtle "Reconnecting..." indicator
- Navigation stays available
- No forced reset

## 8.2 Solo — Reconnect Rule

On successful reconnect:

- Devices synchronize to latest page change
- Most recent page change becomes source of truth
- Sync must be smooth (no abrupt flicker)

## 8.3 Solo — Long Loss

- Devices continue independently
- Manual reconnect remains possible
- No content loss

## 8.4 Choir Follower — Temporary Loss

- Last page remains visible
- Subtle "Disconnected" indicator
- Local navigation remains available

## 8.5 Choir Follower — Auto Rejoin

- Store session token locally
- Retry in background using stored token
- If session active:
  - Rejoin automatically
  - Follow mode followers resync to Master page
  - Free mode followers remain Free

## 8.6 Choir Master Loss

- Followers stay on current page
- Follow behavior pauses temporarily
- Followers can navigate locally

When Master returns:

- Session resumes
- Follow mode followers resync
- Free mode followers unchanged

## 8.7 Rapid Page Changes

- Apply most recent page only
- Intermediate states may be skipped

## 8.8 Song Change Priority

On reconnect after song changes:

- Current song from Master must be applied immediately
- Song context overrides old page state

## 8.9 Session End

When Master ends session:

- Followers notified
- Temporary streamed content cleared
- Session token invalidated
- Followers return to local mode

---

# 9. Android-Specific Behavior Requirements

## 9.1 App Lifecycle

- App resume should restore last local UI state quickly
- Active session state should recover gracefully when possible
- Unexpected process death must not corrupt local library/setlists

## 9.2 Screen and Power Conditions

- Screen off/on should not immediately break active session
- If session drops due to OS/network conditions, reconnection flow must start automatically

## 9.3 Connectivity Assumptions

- Devices are expected on same local network or hotspot
- Internet is not required for core runtime behavior once installed

## 9.4 Permissions (Functional Expectation)

App may request only required permissions for:

- File import
- Local network communication
- Optional QR scanning
- Optional Bluetooth pedal integration

No unnecessary permissions.

---

# 10. Streaming Behavior (User Perspective)

In Choir mode:

- Song content may be streamed for temporary viewing
- Streamed content is temporary
- No export option
- No permanent file access from streamed source
- Optional watermark may indicate streamed content

---

# 11. UX Principles

- Minimal interface
- No visual noise
- Clear state indicators:
  - Connected / Disconnected
  - Follow / Free
- Music-first interaction
- Predictable system behavior
- No hidden automation

---

# 12. Non-Goals (V2)

- No PDF editing
- No page reordering inside PDFs
- No annotation system
- No cloud account requirement
- No online public sharing
- No advanced score editing
- No per-follower permission hierarchy
- No iOS or desktop target in this version

---

# End of Product Spec V2
