# Sprint 2 — Local Ubuntu Dual-Instance Test Harness (Master/Slave)

> **Sprint length (target):** short  
> **Goal:** enable reliable manual testing on a single Ubuntu machine by emulating “Master tablet” and “Slave tablet” in two isolated browser contexts, with a minimal pairing flow.

## 0. References (source of truth)

- `PRODUCT_SPEC_V1.md` — expected user workflow and roles :contentReference[oaicite:0]{index=0}
- `UI_ARCHITECTURE_V1.md` — screens / navigation expectations 
- `SYNC_ENGINE_V1.md` — sync & pairing principles (no heavy server) :contentReference[oaicite:2]{index=2}
- `TECH_STACK_V1.md` — stack constraints (React/TS/Vite/PWA) 

---

## 1. Scope

### In scope (Sprint 2)
1) **Dual-instance dev setup (Ubuntu)**
- Run two app instances locally on different ports:
  - Master: `http://localhost:5173`
  - Slave:  `http://localhost:5174`
- Each instance can be configured as `MASTER` or `SLAVE` via env var.

2) **A minimal “Test Harness” screen**
- A dedicated route: `/test-harness`
- Displays:
  - role (MASTER/SLAVE)
  - app instance (port, build info)
  - WebRTC connection state (idle/offer-created/answer-created/connected/disconnected)
  - last received “sync event” (for quick verification)

3) **Manual pairing flow (no server)**
- Implement a **copy/paste signaling** flow for WebRTC:
  - MASTER: “Create Offer” → produces a text blob (SDP offer) + “Copy”
  - SLAVE:  “Paste Offer” → “Create Answer” → produces answer blob + “Copy”
  - MASTER: “Paste Answer” → connect
- Once connected, open a DataChannel and allow sending a simple message:
  - “Next Page” / “Prev Page” dummy events (no PDF viewer required yet)

4) **Manual test plan (Ubuntu)**
- A short reproducible checklist to validate the above using two Chrome profiles.

### Explicitly out of scope (Sprint 2)
- Real session discovery / QR code / reconnect tokens (later, dedicated sprint) :contentReference[oaicite:4]{index=4}
- Full sync engine rules, checkpoints, stream cache, etc. (later) :contentReference[oaicite:5]{index=5}
- PDF rendering + page navigation in viewer (later) 

---

## 2. Deliverables

### 2.1 Dev scripts (two ports)
Add npm scripts (example naming; keep consistent with repo conventions):

- `dev:master` → starts Vite on `5173` with role `MASTER`
- `dev:slave`  → starts Vite on `5174` with role `SLAVE`

Role comes from:
- `VITE_DEVICE_ROLE=MASTER|SLAVE`

### 2.2 Test Harness route
Route: `/test-harness`

Components (minimal UI, no styling effort):
- Role badge
- Status panel (connection state + ICE state)
- Signaling panel (textarea + copy/paste buttons)
- “Send event” buttons (next/prev) + log output

### 2.3 WebRTC module (minimal)
Create a small, isolated module in `src/sync/webrtc/`:

- `webrtc_signaling.ts`
  - createOffer(): Promise<string>
  - acceptOfferAndCreateAnswer(offerSdp: string): Promise<string>
  - acceptAnswer(answerSdp: string): Promise<void>

- `webrtc_channel.ts`
  - openDataChannel()
  - send(event)
  - onMessage(callback)

Events (for this sprint):
- `SYNC_TEST_NEXT`
- `SYNC_TEST_PREV`

Message format:
- JSON `{ type: string, ts: number }`

### 2.4 Manual test plan doc
Add: `docs/sprints/sprint_2_test_plan.md` (short, “do this / expect that”)

---

## 3. Implementation Tasks (checklist)

### A) Two-instance dev workflow
- [ ] Add `VITE_DEVICE_ROLE` support (env-driven)
- [ ] Add scripts `dev:master` and `dev:slave` with fixed ports
- [ ] Ensure both instances run simultaneously without collisions

### B) Test Harness page
- [ ] Add `/test-harness` route
- [ ] Add panels: status, signaling, event sender, logs
- [ ] Show connection state updates in real time

### C) Manual WebRTC pairing (copy/paste SDP)
- [ ] MASTER: create offer + copy
- [ ] SLAVE: paste offer → create answer + copy
- [ ] MASTER: paste answer → connected
- [ ] Open DataChannel on connect
- [ ] Send/receive dummy events and show logs

### D) Minimal guardrails
- [ ] Validate pasted SDP (basic checks, user-friendly errors)
- [ ] “Reset session” button clears state in each instance

### E) CI impact (keep green)
- [ ] Ensure `lint`, `typecheck`, `test`, `build` still pass
- [ ] Add at least one unit test for message encoding/decoding (pure TS, no real WebRTC)

---

## 4. Acceptance Criteria

Sprint 2 is DONE when:

1) **Ubuntu local test works**
- Terminal A: `npm run dev:master` → app opens on `5173`
- Terminal B: `npm run dev:slave`  → app opens on `5174`

2) **Master/Slave emulation is reliable**
- You can open:
  - Chrome Profile “Master” on `5173/test-harness`
  - Chrome Profile “Slave” on `5174/test-harness`

3) **Manual pairing succeeds**
- Copy/paste Offer/Answer results in:
  - connection state “CONNECTED”
  - DataChannel open

4) **Events flow**
- Clicking “Next Page” on MASTER shows a received log on SLAVE (and vice versa)

5) **CI remains green**
- `dev_CI.yml` still passes unchanged (or updated only if needed)

---

## 5. Manual Test Plan (Ubuntu) — quick steps

### Setup: two Chrome profiles
- Create two separate Chrome profiles (recommended):
  - Profile A: Master
  - Profile B: Slave

### Run
1) Start Master
- `npm run dev:master`
- Open Profile A → `http://localhost:5173/test-harness`

2) Start Slave
- `npm run dev:slave`
- Open Profile B → `http://localhost:5174/test-harness`

### Pair (copy/paste signaling)
3) In MASTER page:
- Click **Create Offer**
- Click **Copy Offer**

4) In SLAVE page:
- Paste offer into “Remote SDP”
- Click **Create Answer**
- Click **Copy Answer**

5) In MASTER page:
- Paste answer into “Remote SDP”
- Click **Accept Answer / Connect**

### Verify
6) Send events:
- MASTER: click “Next”
- SLAVE: should log received `SYNC_TEST_NEXT`
- SLAVE: click “Prev”
- MASTER: should log received `SYNC_TEST_PREV`

---

## 6. Notes

- This sprint intentionally uses **manual signaling** to enable testing without any server.
- A later sprint can replace it with QR/token-based rendezvous aligned with `SYNC_ENGINE_V1.md`. :contentReference[oaicite:7]{index=7}