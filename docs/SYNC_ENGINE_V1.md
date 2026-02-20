# Maestral — Synchronization Engine Specification (V1)

This document is the technical source of truth for real-time synchronization.
It is aligned with:

- `PRODUCT_SPEC_V1.md` for behavior requirements
- `TECH_STACK_V1.md` for technology and architecture choices
- `UI_ARCHITECTURE_V1.md` for user-visible states

---

## 1. Scope

V1 synchronization covers:

- Solo Mode (Dual Screen): two paired devices with equal manual page authority
- Choir Mode (Master + Followers): one Master, one or more Followers
- Reconnection and state convergence without blocking local navigation

V1 synchronization does not include:

- Cloud signaling or cloud relay
- Remote Internet sessions
- Permanent export of streamed choir content

---

## 2. Core Guarantees

The sync engine MUST guarantee:

- Deterministic state convergence after temporary disconnections
- Page-based synchronization only (no continuous scrolling semantics)
- Song-change priority over page state in Choir Mode
- Non-blocking behavior: users can keep navigating locally when disconnected

Performance target:

- During songs, page updates should propagate within about 1 second on local LAN

---

## 3. Terminology

- Device ID: stable local identifier for one installation
- Session ID: identifier of one active sync session
- Session Token: join credential used in Choir Mode and stored by Followers for reconnect
- Mode:
  - Solo
  - Choir Master
  - Choir Follower
- Follower Control Mode:
  - Follow
  - Free
- Song Epoch: monotonic counter incremented by Master at each song change
- Page Revision: monotonic counter for page updates inside one song epoch

---

## 4. Network Model

- Transport: WebRTC DataChannels over local Wi-Fi (LAN)
- Architecture:
  - Solo: one peer-to-peer link between two devices
  - Choir: star topology, one DataChannel per Follower<->Master pair
- No backend server is required at runtime
- No TURN dependency is required for the primary V1 LAN scope

---

## 5. Session Topologies

### 5.1 Solo Mode

- If only one device is present, sync engine remains in local-only mode.
- When a second device is paired, a synchronized pair is created.
- Both devices can emit page changes.
- One device is marked as page leader for odd/even complementary layout.

### 5.2 Choir Mode

- Master creates a session and exposes QR/token for joining.
- Followers join with QR or manual token.
- Master maintains one logical session state and broadcasts updates to connected Followers.

---

## 6. Pairing and Join Flows

### 6.1 Solo Pairing Flow (Serverless)

1. Device A creates offer payload.
2. Device A displays offer as QR/text.
3. Device B scans/inputs offer and creates answer payload.
4. Device B returns answer as QR/text.
5. Devices establish DataChannel.
6. Devices exchange `HELLO` and initial sync snapshot.

### 6.2 Choir Session Creation and Join Flow

1. Master starts session and generates `session_id` + `session_token`.
2. Master displays join QR/token.
3. Follower scans QR or enters token.
4. Signaling exchange completes and DataChannel opens.
5. Follower sends `JOIN_REQUEST` with token.
6. Master validates token and responds `JOIN_ACCEPT` + current snapshot.

### 6.3 Choir Rejoin Flow (Automatic)

- Follower stores session token locally.
- On connection loss, Follower retries in background using stored token.
- If session is still active, Master returns current snapshot.
- If session ended/invalid token, Follower receives rejection and returns to local mode.

---

## 7. Protocol Envelope

All sync messages use a common envelope:

```json
{
  "v": 1,
  "session_id": "string",
  "sender_id": "string",
  "type": "MESSAGE_TYPE",
  "ts": 1735689600000,
  "payload": {}
}
```

Fields:

- `v`: protocol version (V1 = 1)
- `session_id`: active session identifier
- `sender_id`: sender device identifier
- `type`: message type
- `ts`: sender timestamp in milliseconds
- `payload`: type-specific body

Unknown message types MUST be ignored safely.

---

## 8. Message Catalog (V1)

### 8.1 Link / Session Lifecycle

- `HELLO`:
  - declares mode (`solo`, `choir_master`, `choir_follower`) and capabilities
- `JOIN_REQUEST` (Choir Follower -> Master):
  - includes session token
- `JOIN_ACCEPT` (Master -> Follower):
  - confirms membership and includes state snapshot
- `JOIN_REJECT` (Master -> Follower):
  - reason: `invalid_token`, `session_ended`, `version_mismatch`
- `LEAVE_SESSION`:
  - explicit leave by Follower
- `SESSION_END` (Master -> Followers):
  - terminates session and invalidates token

### 8.2 State Sync

- `STATE_SNAPSHOT`:
  - full authoritative state for resync/rejoin
- `SET_SONG`:
  - updates current song and increments song epoch
- `SET_PAGE`:
  - updates current page inside current song epoch
- `SET_LAYOUT_PARITY` (Solo):
  - leader parity: `odd` or `even`
- `SET_FOLLOW_MODE` (Follower local mode publication):
  - `follow` or `free`

### 8.3 Stream Control (Choir)

- `STREAM_PREPARE`:
  - signals temporary streamed score availability for current song
- `STREAM_CLEAR`:
  - clears temporary streamed content (also implied by `SESSION_END`)

Note:
- In Choir Mode, streamed score delivery is part of the V1 session model.
- Streamed content remains view-only and temporary in V1.

---

## 9. Authoritative State Model

### 9.1 Solo Shared State

```json
{
  "song_id": "string|null",
  "page_index": 0,
  "layout": {
    "leader_device_id": "string",
    "parity": "odd|even"
  },
  "last_page_change": {
    "sender_id": "string",
    "ts": 1735689600000
  }
}
```

### 9.2 Choir Master State

```json
{
  "session_id": "string",
  "session_token": "opaque-string",
  "song_id": "string|null",
  "song_epoch": 0,
  "page_index": 0,
  "page_revision": 0
}
```

### 9.3 Choir Follower Local State

```json
{
  "session_id": "string|null",
  "follow_mode": "follow|free",
  "song_id": "string|null",
  "song_epoch": 0,
  "page_index": 0,
  "last_token": "opaque-string|null"
}
```

---

## 10. State Machines

### 10.1 Generic Link State

`IDLE -> CONNECTING -> CONNECTED -> DEGRADED -> RECONNECTING -> CONNECTED`

and terminal exits:

`CONNECTED -> ENDED`

Definitions:

- `IDLE`: no active link
- `CONNECTING`: signaling/handshake in progress
- `CONNECTED`: DataChannel open and healthy
- `DEGRADED`: temporary link issue detected; UI shows subtle reconnect/disconnect indicator
- `RECONNECTING`: automatic retries in background
- `ENDED`: session closed or user left

### 10.2 Solo State Machine

- `SOLO_LOCAL_ONLY`: one device, no pair
- `SOLO_PAIRED_CONNECTED`: two devices synchronized
- `SOLO_PAIRED_DEGRADED`: temporary link loss, local navigation continues
- `SOLO_PAIRED_RECONNECTING`: automatic retry loop

Transitions:

- Pair success: `SOLO_LOCAL_ONLY -> SOLO_PAIRED_CONNECTED`
- Temporary loss: `SOLO_PAIRED_CONNECTED -> SOLO_PAIRED_DEGRADED -> SOLO_PAIRED_RECONNECTING`
- Reconnect success: `SOLO_PAIRED_RECONNECTING -> SOLO_PAIRED_CONNECTED`
- Reconnect failure timeout: remain local on both devices until manual action

### 10.3 Choir Master State Machine

- `MASTER_IDLE`
- `MASTER_SESSION_ACTIVE`
- `MASTER_RECONNECTING_LINKS` (one or more Followers disconnected)
- `MASTER_SESSION_ENDED`

### 10.4 Choir Follower State Machine

- `FOLLOWER_IDLE_LOCAL`
- `FOLLOWER_JOINING`
- `FOLLOWER_CONNECTED_FOLLOW`
- `FOLLOWER_CONNECTED_FREE`
- `FOLLOWER_DISCONNECTED_LOCAL`
- `FOLLOWER_REJOINING`

Key transitions:

- Join accepted in follow mode: `FOLLOWER_JOINING -> FOLLOWER_CONNECTED_FOLLOW`
- Toggle follow/free: between connected follow/free states
- Link loss: connected state -> `FOLLOWER_DISCONNECTED_LOCAL`
- Auto-retry: `FOLLOWER_DISCONNECTED_LOCAL -> FOLLOWER_REJOINING`
- Rejoin success:
  - previous mode follow -> `FOLLOWER_CONNECTED_FOLLOW`
  - previous mode free -> `FOLLOWER_CONNECTED_FREE`
- Session ended/invalid token -> `FOLLOWER_IDLE_LOCAL`

---

## 11. Convergence and Conflict Resolution

### 11.1 Solo Reconnect Conflict

Requirement from product spec: latest page change wins.

V1 rule:

- On reconnect, each device shares its `last_page_change` metadata.
- Device state with the most recent `ts` is selected as source of truth.
- Tie-breaker: lexicographically higher `sender_id` wins.
- Both devices apply winning page state without UI flicker.

### 11.2 Choir Rapid Page Changes

- Master increments `page_revision` on every page change.
- Followers apply only updates with revision strictly newer than their local revision.
- Intermediate revisions MAY be skipped; final revision MUST be applied.

### 11.3 Choir Song Change Priority

- Master increments `song_epoch` on song change and resets page revision for new song context.
- Any Follower page state from older song epoch is stale and MUST be discarded.
- On rejoin, current song epoch from Master overrides previous Follower page context.

### 11.4 Follow vs Free Semantics

- In `follow` mode, Follower applies incoming `SET_PAGE` for current song epoch.
- In `free` mode, Follower ignores incoming `SET_PAGE` but still applies `SET_SONG`.
- Switching `free -> follow` triggers immediate sync to Master current page.

---

## 12. Reconnection Logic

### 12.1 Retry Policy

- Retries run silently in background.
- UI remains responsive; local navigation remains enabled.
- Exponential backoff with capped interval SHOULD be used to reduce network spam.

### 12.2 Solo Reconnection

- Both peers attempt auto-reconnect after temporary loss.
- If long reconnection fails, both remain operational independently.
- Manual repair/re-pair remains available.

### 12.3 Choir Follower Reconnection

- Follower retries using stored token.
- If session active and token valid: automatic rejoin + snapshot sync.
- If token invalid/session ended: Follower exits to local mode and clears active session state.

### 12.4 Master Disconnection in Choir

- Followers keep last visible page.
- Follow behavior is temporarily inactive.
- Followers can navigate locally.
- After Master returns, follow-mode Followers resync; free-mode Followers remain unaffected.

---

## 13. Session Termination Semantics

When Master ends a Choir session:

- Master broadcasts `SESSION_END`.
- Followers transition to local mode.
- Streamed content is cleared.
- Session token becomes invalid for further rejoins.

---

## 14. Reliability and Safety Rules

- Protocol must be forward-safe: unknown fields/types are ignored.
- Invalid or out-of-order state messages must not crash client state.
- Duplicate messages must be tolerated (idempotent application by epoch/revision rules).
- Sync engine must never block score rendering interaction loop.

---

## 15. Traceability to Product Rules

This spec directly implements:

- Solo equal navigation authority and paired page mirroring
- Solo reconnect with latest-page source of truth
- Choir follow/free behavior and free-mode autonomy for page turns
- Choir automatic rejoin via stored token
- Choir rapid-page final-state priority
- Choir song-change priority over page state
- Choir session-end token invalidation and streamed-content clearing
