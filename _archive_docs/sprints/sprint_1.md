# Sprint 1 — Project Bootstrap + Local Storage Foundation + Dev CI

> **Sprint length (target):** short (setup + foundations only)  
> **Goal:** create a minimal but production-shaped baseline so every next sprint is easier, safer, and faster.

## 0. References (source of truth)

- `PRODUCT_SPEC_V1.md` — user behaviors and rules :contentReference[oaicite:0]{index=0}
- `TECH_STACK_V1.md` — chosen stack and architecture :contentReference[oaicite:1]{index=1}
- `DB_SCHEMA.md` — IndexedDB schema v1 and migration rules :contentReference[oaicite:2]{index=2}
- `README.md` — documentation responsibilities :contentReference[oaicite:3]{index=3}

This sprint MUST NOT redefine architecture. It only implements foundations aligned with the references. :contentReference[oaicite:4]{index=4}

---

## 1. Scope

### In scope (Sprint 1)
1) **Repository bootstrap**
- React + TypeScript + Vite baseline (PWA-ready)
- Minimal folder structure aligned with long-term maintainability

2) **Local storage foundation**
- IndexedDB database `maestral` schema version `1`
- A thin storage layer (Dexie recommended by stack doc) :contentReference[oaicite:5]{index=5}
- Create the DB wrapper + define stores (no UI usage required yet)

3) **CI on GitHub**
- `dev_CI.yml` that runs on:
  - push to `dev`
  - pull_request targeting `dev`
- Checks: install, lint, typecheck, tests, build

### Explicitly out of scope (Sprint 1)
- WebRTC / pairing / sync engine implementation (see `SYNC_ENGINE_V1.md`) :contentReference[oaicite:6]{index=6}
- PDF.js rendering and Viewer implementation (only later) :contentReference[oaicite:7]{index=7}
- Library import UX, Setlists UX, Session screens UX (only later) :contentReference[oaicite:8]{index=8}
- Streaming behavior and cache policies in runtime (only DB scaffolding now) :contentReference[oaicite:9]{index=9}

---

## 2. Deliverables

### 2.1 Repo structure (minimum)
Create a maintainable baseline such as:

- `src/`
  - `app/` (app shell, routing placeholder)
  - `core/` (shared utilities, types)
  - `storage/` (IndexedDB/Dexie)
- `docs/` (already exists; no rework in this sprint)
- `.github/workflows/dev_CI.yml`

> Keep it minimal. The goal is “solid skeleton”, not features.

### 2.2 Local DB (IndexedDB) baseline
Implement DB identity and schema as specified:

- DB name: `maestral`
- schema version: `1` :contentReference[oaicite:10]{index=10}

Stores to define (schema only; no UI yet): :contentReference[oaicite:11]{index=11}
- `songs`
- `song_assets`
- `setlists`
- `setlist_items`
- `app_settings`
- `choir_reconnect_tokens`
- `sync_checkpoints`
- `stream_cache`

Also implement **integrity helper expectations** (as code-level utilities), based on rules: :contentReference[oaicite:12]{index=12}
- no orphan rows (song_assets, setlist_items)
- unique order index constraints per song/setlist
- cleanup helpers stubs (session-end invalidation / stream cache clearing)

### 2.3 CI workflow
Add `.github/workflows/dev_CI.yml` that runs:
- dependency install
- lint
- typecheck
- unit tests
- build

---

## 3. Implementation Tasks (checklist)

### A) Bootstrap app (React + TS + Vite)
- [ ] Scaffold React+TS+Vite project
- [ ] Add basic PWA plumbing (manifest + service worker placeholder) consistent with V1 PWA goals :contentReference[oaicite:13]{index=13}
- [ ] Add standard scripts: `dev`, `build`, `preview`, `test`, `lint`, `typecheck`
- [ ] Add minimal “App Shell” page that renders a neutral placeholder (no product UI yet)

### B) Code quality baseline
- [ ] Add formatting/linting (choose one consistent baseline)
- [ ] Enforce TypeScript strictness appropriate for maintainability (avoid `any` by default)

### C) Storage layer (IndexedDB via Dexie)
- [ ] Create `src/storage/maestral_db.ts` (or equivalent)
- [ ] Implement schema version `1` with all stores from `DB_SCHEMA.md` :contentReference[oaicite:14]{index=14}
- [ ] Define TypeScript models for each store (minimum fields required by schema)
- [ ] Provide small repository-style helpers (no UI):
  - [ ] `songs_repo` with `create/update/get/list`
  - [ ] `setlists_repo` with `create/update/get/list`
  - [ ] minimal utilities for normalized fields, timestamps, UUID creation
- [ ] Add one migration placeholder strategy note (even if v1 has no migration yet), aligned with “version increments by +1” rule :contentReference[oaicite:15]{index=15}

### D) Tests (smoke tests only)
- [ ] Add unit test framework
- [ ] Add smoke tests:
  - [ ] can open DB
  - [ ] can insert/read a `song`
  - [ ] can insert/read a `setlist` + `setlist_item`

### E) GitHub Actions CI (`dev_CI.yml`)
- [ ] Workflow triggers: push to `dev`, PR to `dev`
- [ ] Steps: checkout, setup node, install, lint, typecheck, test, build
- [ ] Cache dependencies to keep CI fast (optional but recommended)

---

## 4. Acceptance Criteria

Sprint 1 is DONE when:

1) **Local dev works**
- `npm run dev` starts successfully
- App loads a placeholder screen

2) **DB layer exists and is test-covered**
- IndexedDB schema `maestral` v1 matches `DB_SCHEMA.md` store catalog :contentReference[oaicite:16]{index=16}
- Smoke tests pass for basic insert/read operations

3) **CI is green**
- On push to `dev` and PR to `dev`, `dev_CI.yml` runs and is green:
  - lint ✅
  - typecheck ✅
  - tests ✅
  - build ✅

---

## 5. Notes / Guardrails

- This sprint does **not** implement product features yet; it builds the runway.
- Keep everything minimal and deterministic.
- No sync engine code in Sprint 1 (that belongs to a dedicated sprint aligned with `SYNC_ENGINE_V1.md`). :contentReference[oaicite:17]{index=17}