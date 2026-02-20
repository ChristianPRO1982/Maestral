# Maestral — UI Architecture V1

This document defines the V1 user interface behavior and structure.
Source of truth for behavior is `PRODUCT_SPEC_V1.md`.

## 1. UX Principles

- Minimal: The score always has visual priority over controls.
- Calm: UI feedback is subtle, non-blocking, and avoids visual noise.
- Readable: Page content and status indicators remain legible at performance distance.
- Predictable: Identical user actions produce identical results in all modes.
- Explicit state: Connection and control mode are always visible when relevant.
- Non-blocking performance: Temporary connection issues never prevent local page navigation.
- Page-turn responsiveness: During songs, page changes should feel near-immediate and typically complete within about one second.

## 2. Information Architecture

Main areas:

- Library: Manage songs (import, rename, delete) and open songs.
- Setlists: Create, reorder, launch, and advance song sequences.
- Viewer: Full-page score display and page navigation (single page at a time).
- Session: Solo pairing and Choir hosting/joining controls, with live state indicators.

## 3. Screen List

### 3.1 Library Screen

Purpose
- Central entry point for local song collection.

Visible UI elements
- Song list with title and source type (PDF or image-based song).
- Primary import action.
- Song actions: rename, delete.
- Entry points to Setlists and Session.
- No controls for PDF page reordering or PDF page exclusion.
- No controls for image cropping or image editing.

User actions
- Import PDF (one PDF becomes one song).
- Import JPG/PNG files and group as one song.
- Reorder images inside an image-based song.
- Open a song in Viewer.
- Rename or delete a song.
- Navigate to Setlists or Session.

Empty/loading/error states
- Empty: Clear message that no songs are present, with import action.
- Loading: Lightweight loading state while library content is being prepared.
- Error: Import/read failure message with retry and return-to-library actions.

Key indicators (Connected/Disconnected, Follow/Free, Solo pairing state)
- Connected/Disconnected: Hidden.
- Follow/Free: Hidden.
- Solo pairing state: Hidden.

### 3.2 Setlists Overview Screen

Purpose
- Manage the list of setlists.

Visible UI elements
- Setlist list with names.
- Create setlist action.
- Open setlist action.
- Delete setlist action.

User actions
- Create a setlist.
- Open a setlist for editing and launch.
- Delete a setlist.
- Return to Library.

Empty/loading/error states
- Empty: Message that no setlists exist, with create action.
- Loading: Loading state while setlists are fetched.
- Error: State message with retry option.

Key indicators (Connected/Disconnected, Follow/Free, Solo pairing state)
- Connected/Disconnected: Hidden.
- Follow/Free: Hidden.
- Solo pairing state: Hidden.

### 3.3 Setlist Detail Screen

Purpose
- Edit and run one setlist.

Visible UI elements
- Ordered list of songs in the setlist.
- Add song action.
- Reorder handles/actions.
- Remove song action.
- Launch setlist action.
- Next song action available during active setlist playback.

User actions
- Add songs to setlist.
- Reorder songs.
- Remove songs.
- Launch setlist into Viewer.
- Move to next song.

Empty/loading/error states
- Empty: Message that setlist has no songs, with add-song action.
- Loading: Loading state while setlist data is prepared.
- Error: State message with retry.

Key indicators (Connected/Disconnected, Follow/Free, Solo pairing state)
- Connected/Disconnected: Hidden unless user is in an active Choir session.
- Follow/Free: Hidden unless user is in Follower view.
- Solo pairing state: Hidden.

### 3.4 Viewer Screen

Purpose
- Display one score page at a time for performance.

Visible UI elements
- Single-page score canvas.
- Previous/next page actions.
- Optional first/last page actions.
- Zoom controls and reset-view action.
- Current page indicator.
- Optional lightweight watermark for streamed Choir content.
- Subtle state strip for live indicators.

User actions
- Move to previous/next page.
- Optionally jump to first/last page.
- Zoom within current page.
- Pan within zoomed page.
- Return to Library or Setlists.
- Continuous page scroll is not available.

Empty/loading/error states
- Empty: Neutral placeholder when no song is selected.
- Loading: Short loading state when opening a song or switching songs; brief between-song load is acceptable.
- Error: Cannot display page message with return and retry actions.

Key indicators (Connected/Disconnected, Follow/Free, Solo pairing state)
- Connected/Disconnected: Visible when in Solo dual-device or Choir session.
- Follow/Free: Visible only for Choir Followers.
- Solo pairing state: Visible in Solo dual-device mode (single device, paired-as-leader, paired-as-complement).

### 3.5 Solo Pairing Screen

Purpose
- Configure Solo Mode pairing and page distribution behavior.

Visible UI elements
- Solo state summary: single device or paired.
- Pair/connect actions.
- Page Leader choice control: odd pages or even pages.
- Pairing status and reconnect status.

User actions
- Use Solo as single device.
- Pair a second device.
- Choose Page Leader parity (odd/even) on the leader device.
- Manually retry pairing if auto-reconnect does not complete.

Empty/loading/error states
- Empty: Single-device ready state.
- Loading: Pairing/reconnecting in progress with non-blocking message.
- Error: Pairing failed state with retry action.

Key indicators (Connected/Disconnected, Follow/Free, Solo pairing state)
- Connected/Disconnected: Always visible.
- Follow/Free: Hidden.
- Solo pairing state: Always visible.

### 3.6 Choir Session Host Screen (Master)

Purpose
- Create and run a Choir session.

Visible UI elements
- Start session action.
- Join token and QR presentation.
- Connected follower count.
- Song controls: select, previous song, next song.
- Page controls and current page indicator.
- End session action.
- No per-follower permission panel.

User actions
- Start session.
- Show token/QR for joining.
- Select song and change song.
- Change page.
- End session.

Empty/loading/error states
- Empty: No active session yet.
- Loading: Session creation/joining in progress.
- Error: Session start/connect issue with retry.

Key indicators (Connected/Disconnected, Follow/Free, Solo pairing state)
- Connected/Disconnected: Visible for session state.
- Follow/Free: Hidden for Master.
- Solo pairing state: Hidden.

### 3.7 Choir Join Screen (Follower)

Purpose
- Join and participate in a Choir session as Follower.

Visible UI elements
- Join via QR action.
- Join via token/manual entry action.
- Follow/Free toggle.
- Connection status.
- Current song and page context once connected.

User actions
- Join session by QR or token.
- Toggle Follow or Free.
- Navigate pages locally in Free mode, and during temporary disconnection.
- Leave session and return to local mode.
- Streamed songs are view-only, with no export or permanent file-save action.

Empty/loading/error states
- Empty: Not connected state with join actions.
- Loading: Joining/reconnecting state.
- Error: Join failed/disconnected state with retry.

Key indicators (Connected/Disconnected, Follow/Free, Solo pairing state)
- Connected/Disconnected: Always visible.
- Follow/Free: Always visible while session is active.
- Solo pairing state: Hidden.

## 4. Navigation Flows

### 4.1 Global Flows

- Open app -> Library shown.
- Library -> open song -> Viewer.
- Library -> Setlists -> open setlist -> launch -> Viewer.
- Viewer -> back -> returns to previous area (Library or Setlists).

### 4.2 Solo Mode Flows

- Single device flow: Enter Solo Mode with no pair; Viewer shows sequential pages on one device.
- Dual device pairing flow: User pairs second device; both devices remain navigable and page changes mirror to both.
- Odd/even leader choice flow: Leader chooses odd or even; paired device shows complementary page.
- Last-page empty behavior flow: If no complementary page exists, opposite device shows stable neutral empty page.
- Reconnection flow: On disconnect, both devices keep current page and navigation; subtle reconnect indicator appears; when connection returns, both sync to most recently changed page; if reconnect fails long-term, both continue independently.
- Pedal authority flow: In dual-device Solo, pedal input on the primary device changes the shared page state seen on both devices.

### 4.3 Choir Mode Flows

- Master create session flow: Master starts session, shows QR/token, Followers join.
- Join flow: Follower joins via QR or token/manual entry.
- Rejoin flow: Follower stores token and silently retries reconnect; if session still active, follower rejoins automatically.
- Follow/Free flow: Follower toggles mode; Follow tracks Master page, Free keeps independent page control; Master page turns never force a follower in Free mode.
- Rejoin mode preservation flow: After reconnect, follower remains in Free if previously Free; followers in Follow mode resync to Master page.
- Song change priority flow: Master song change forces all followers to the new song, including followers that reconnect later.
- Session termination flow: When Master ends session, followers are notified, streamed content is cleared, the token becomes invalid, and followers return to local mode.

## 5. Edge-Case UX Behaviors

### 5.1 What the User Sees During Reconnect

- Solo temporary disconnect: Current page remains; subtle "Reconnecting..." status shown; controls stay active.
- Choir follower disconnect: Last page remains; subtle "Disconnected" status shown; local navigation remains available.
- Choir Master disconnect: Followers remain on current page; Follow behavior pauses; followers continue local navigation; when Master reconnects, followers in Follow mode resync and followers in Free mode remain unaffected.

### 5.2 Conflict Resolution Rules (User-Visible Outcomes)

- Solo page conflict on reconnect: If both devices changed page while disconnected, the most recently changed page becomes shared on reconnect.
- Choir rapid page changes: Followers may skip intermediate pages and render only the latest page state.
- Choir reconnect after song change: Current song on Master overrides any previous follower page context immediately.

## 6. Accessibility & Readability Notes

- Font size policy: Core controls and state labels use readable sizes suitable for tablet distance; no critical control text should be rendered below a legible baseline size.
- Touch target policy: Interactive controls use large touch targets appropriate for live performance and quick taps.
- Contrast policy: Status indicators and controls must remain readable over score backgrounds.
- Brightness/night guidance: If app-level Day/Night display presets are supported, they only affect in-app presentation and must not attempt to control system brightness settings.
