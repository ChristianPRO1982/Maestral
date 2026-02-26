# Maestral — Product Specification V1

Tagline: *Where voices move as one.*

---

# 1. Product Vision

Maestral is a digital music stand system designed for choirs and musicians.

It enables synchronized score display across multiple devices while remaining simple, reliable, and focused on performance.

Maestral does not attempt to edit or modify musical scores.
Users are responsible for preparing clean and final PDF files.

The interface must remain minimal.
Music remains central.

---

# 2. Core Modes

Maestral supports two primary modes:

1. Solo Mode (Dual Screen)
2. Choir Mode (Master + Followers)

---

# 3. Global Features (All Modes)

## 3.1 Library Management

Users can:

- Import PDF files
- Import image files (JPG / PNG)

Rules:

- A PDF equals one Song.
- PDF pages cannot be reordered.
- PDF pages cannot be excluded.
- Users must prepare PDFs externally.

For image-based songs:

- Multiple images can be grouped into one Song.
- Images within a Song can be reordered.
- Images cannot be partially cropped or edited.

Users can:

- Rename songs
- Delete songs

---

## 3.2 Setlists

Users can:

- Create a setlist
- Add songs to a setlist
- Reorder songs in a setlist
- Remove songs from a setlist
- Launch a setlist
- Move to the next song

---

## 3.3 Page Navigation

Navigation is page-based only.

- One page is displayed at a time.
- Moving between pages is discrete.
- There is no continuous scrolling between pages.

Users can:

- Go to next page
- Go to previous page
- Jump to first or last page (optional)

Zooming is allowed:

- Users may zoom within a page.
- Zooming allows moving inside the page.
- Zooming does not allow navigation to another page.

---

## 3.4 Performance Expectations

During a song:

- Page changes should occur within approximately 1 second.
- Minor delay is acceptable.
- Long delays (multiple seconds) are unacceptable.

Between songs:

- Short loading time is acceptable.

---

# 4. Solo Mode (Dual Screen)

## 4.1 Purpose

Designed for musicians using one or two devices as a digital open book.

Solo Mode adapts automatically depending on the number of connected devices.

---

## 4.2 Single Device Behavior

If only one device is connected:

- The device displays all pages sequentially.
- Navigation behaves normally (page by page).
- No page pairing logic is applied.

---

## 4.3 Dual Device Behavior

When two devices are connected:

- Both devices are equal in navigation authority.
- Bluetooth pedal connects to one device only (Primary).
- Either device may manually change pages.
- Any page change on one device is immediately reflected on the other.

The experience must mimic a physical open book:
both sides can turn pages.

---

## 4.4 Page Distribution

One device is designated as Page Leader for layout purposes.

The Page Leader may choose:

- Display odd pages
OR
- Display even pages

The other device automatically displays the complementary pages.

Examples:

If Page Leader displays:
- Page 1 → Other device displays Page 2
- Page 3 → Other device displays Page 4

If Page Leader displays:
- Page 2 → Other device displays Page 1
- Page 4 → Other device displays Page 3

---

## 4.5 Edge Case — Last Page

If the last page of a song has no complementary page:

- The opposite screen displays an empty neutral page.
- The layout must remain stable.
- No shifting or resizing occurs.

---

## 4.6 Performance Expectations

During performance:

- Page transitions should occur within approximately 1 second.
- Minor delay is acceptable.
- Transitions must feel stable and predictable.

---

# 5. Choir Mode — Master

## 5.1 Session Management

The Master can:

- Start a session
- Display a QR code or manual token for joining
- See number of connected followers
- End session

The Master does not manage individual user permissions.

---

## 5.2 Song Control

The Master can:

- Select a song
- Change to the next song
- Change to the previous song

When the Master changes song:

- All Followers must switch to the same song.

---

## 5.3 Page Control

The Master can:

- Change page
- See current page number

Changing page does NOT forcibly override followers in Free Mode.

---

# 6. Choir Mode — Follower

## 6.1 Joining

Followers can:

- Join via QR code or manual token
- See connection status
- Automatically reconnect if connection drops

---

## 6.2 Page Behavior

Followers have two modes:

### Follow Mode

- Follower page automatically matches Master page.
- If Master changes page, follower updates.

### Free Mode (Débrayé)

- Follower may navigate pages independently.
- Master page changes do not affect this follower.
- This preference is always respected.

However:

- When the Master changes song,
  all Followers must switch to the new song.

---

## 6.3 Navigation

Followers may:

- Navigate page by page
- Zoom within a page

Navigation remains discrete (no continuous page scroll).

---

# 7. Edge Cases & Reconnection Behavior

---

## 7.1 Solo Mode — Connection Loss

### Temporary Disconnection

If connection between two devices is lost:

- Both devices remain fully operational.
- The current page remains visible.
- A subtle "Reconnecting…" indicator appears.
- Navigation remains available on both devices.

No forced reset occurs.

---

### Automatic Reconnection

Devices must:

- Attempt automatic reconnection in the background.
- Retry silently without blocking the interface.

When reconnection succeeds:

- Both devices synchronize to the most recently changed page.
- The device with the latest page change becomes the source of truth.
- Synchronization must occur smoothly without abrupt flicker.

---

### Long Disconnection

If reconnection fails:

- Both devices continue operating independently.
- Users may manually reconnect if desired.
- No content is lost.

The system must never block performance.

---

## 7.2 Choir Mode — Follower Disconnection

### Temporary Disconnection

If a follower loses connection:

- The last visible page remains displayed.
- A subtle "Disconnected" indicator appears.
- The follower may continue navigating locally.

---

### Automatic Reconnection

Followers must:

- Store the session token obtained via QR code or manual entry.
- Attempt automatic reconnection using the stored token.
- Retry silently in the background.

If the session is still active:

- The follower rejoins automatically.
- If in Follow Mode, it synchronizes to the Master’s current page.
- If in Free Mode, it remains in Free Mode.

No manual action should be required in normal conditions.

---

## 7.3 Choir Mode — Master Disconnection

If the Master device disconnects:

- Followers remain on their current page.
- Follow Mode becomes temporarily inactive.
- Followers may continue navigating locally.

When the Master reconnects:

- The session resumes.
- Followers in Follow Mode synchronize automatically.
- Followers in Free Mode remain unaffected.

---

## 7.4 Rapid Page Changes

If the Master changes pages rapidly:

- Followers must update to the most recent page only.
- Intermediate page states may be skipped.
- System prioritizes final state over replaying history.

---

## 7.5 Song Change Priority

If a song change occurs while a follower is disconnected:

- Upon reconnection, the follower must immediately load the current song.
- Song changes always override previous page state.

---

## 7.6 Session Termination

When the Master ends the session:

- Followers are notified.
- Streamed content is cleared.
- Session token becomes invalid.
- Followers return to local mode.

---

# 8. Streaming Behavior (User Perspective)

In Choir Mode:

- Songs are streamed for viewing only.
- Streamed content is temporary.
- No export option exists.
- No permanent file access is provided.
- A watermark may indicate that content is streamed.

---

# 9. UX Principles

- Minimal interface.
- No visual noise.
- Clear state indicators:
  - Connected / Disconnected
  - Follow / Free
- Music must remain the focus.
- System must behave predictably.
- No hidden automation.

---

# 10. Non-Goals (V1)

- No PDF editing
- No page reordering inside PDFs
- No annotation system
- No cloud accounts
- No online public sharing
- No advanced score editing
- No user permission hierarchy

---

# End of Product Spec V1
