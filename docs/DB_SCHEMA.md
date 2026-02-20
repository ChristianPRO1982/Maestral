# Maestral — DB Schema (V1)

This document defines the client-side storage schema for Maestral V1.
It is aligned with:

- `PRODUCT_SPEC_V1.md` (functional behavior)
- `TECH_STACK_V1.md` (IndexedDB and local-first architecture)
- `SYNC_ENGINE_V1.md` (reconnection and sync state persistence)

---

## 1. Scope

V1 storage is local and client-side only.
There is no backend database.

The schema covers:

- Local library (PDF songs and image-based songs)
- Setlists and song ordering
- Local settings and role preferences
- Reconnection token persistence (Choir follower)
- Temporary streamed-content cache (Choir)
- Minimal sync checkpoints for deterministic reconnect

---

## 2. Storage Principles

- Local-first: all durable data is stored per device.
- Deterministic: persisted sync state must support predictable reconnect behavior.
- Minimal: store only what is needed for V1 scope.
- Non-destructive to score content: no edit/crop/annotation fields.
- Temporary streaming: streamed Choir content is ephemeral and must be purgeable.

---

## 3. IndexedDB Identity

- Database name: `maestral`
- Initial schema version: `1`
- Engine: IndexedDB (wrapper allowed, e.g. Dexie)

---

## 4. Object Store Catalog (V1)

| Store | Primary Key | Main Indexes | Purpose |
|---|---|---|---|
| `songs` | `song_id` | `title_normalized`, `source_kind`, `updated_at` | Song metadata |
| `song_assets` | `asset_id` | `song_id`, `[song_id+order_index]` unique, `asset_kind` | PDF/image assets attached to songs |
| `setlists` | `setlist_id` | `name_normalized`, `updated_at` | Setlist metadata |
| `setlist_items` | `item_id` | `setlist_id`, `[setlist_id+order_index]` unique, `song_id` | Ordered songs inside setlists |
| `app_settings` | `key` | none | Global local settings |
| `choir_reconnect_tokens` | `session_id` | `status`, `updated_at` | Stored token for automatic follower reconnect |
| `sync_checkpoints` | `checkpoint_id` | `scope_type`, `scope_id`, `updated_at` | Last known sync position for reconnect convergence |
| `stream_cache` | `cache_id` | `session_id`, `song_id`, `expires_at` | Temporary streamed content for Choir mode |

---

## 5. Data Models

### 5.1 `songs`

| Field | Type | Required | Notes |
|---|---|---|---|
| `song_id` | string (UUID) | yes | Stable song identifier |
| `title` | string | yes | User-visible title |
| `title_normalized` | string | yes | Search/sort helper |
| `source_kind` | enum: `pdf` \| `image` | yes | Song type |
| `page_count` | number | no | Known page/image count |
| `created_at` | number (ms epoch) | yes | Creation timestamp |
| `updated_at` | number (ms epoch) | yes | Last update timestamp |

Constraints:

- One song exists even when content source differs.
- `source_kind=pdf` and `source_kind=image` follow asset rules in `song_assets`.

### 5.2 `song_assets`

| Field | Type | Required | Notes |
|---|---|---|---|
| `asset_id` | string (UUID) | yes | Asset identifier |
| `song_id` | string | yes | FK-like link to `songs.song_id` |
| `asset_kind` | enum: `pdf` \| `image` | yes | Asset type |
| `order_index` | number | yes | Display order inside song |
| `storage_ref` | string | yes | Opaque local reference to binary content |
| `mime_type` | string | yes | `application/pdf`, `image/png`, `image/jpeg` |
| `created_at` | number (ms epoch) | yes | Creation timestamp |

Constraints:

- For `songs.source_kind=pdf`: exactly one `song_assets` row, `asset_kind=pdf`, `order_index=0`.
- For `songs.source_kind=image`: one or more rows, `asset_kind=image`, ordered by `order_index`.
- `[song_id+order_index]` must be unique.
- No crop/edit metadata is stored in V1.

### 5.3 `setlists`

| Field | Type | Required | Notes |
|---|---|---|---|
| `setlist_id` | string (UUID) | yes | Setlist identifier |
| `name` | string | yes | User-visible setlist name |
| `name_normalized` | string | yes | Search/sort helper |
| `created_at` | number (ms epoch) | yes | Creation timestamp |
| `updated_at` | number (ms epoch) | yes | Last update timestamp |

### 5.4 `setlist_items`

| Field | Type | Required | Notes |
|---|---|---|---|
| `item_id` | string (UUID) | yes | Item identifier |
| `setlist_id` | string | yes | FK-like link to `setlists.setlist_id` |
| `song_id` | string | yes | FK-like link to `songs.song_id` |
| `order_index` | number | yes | Position in setlist |
| `created_at` | number (ms epoch) | yes | Creation timestamp |

Constraints:

- `[setlist_id+order_index]` must be unique.
- Deleting a setlist removes all linked `setlist_items`.
- Removing one item re-compacts ordering to avoid gaps.

### 5.5 `app_settings`

| Field | Type | Required | Notes |
|---|---|---|---|
| `key` | string | yes | Setting key |
| `value` | JSON | yes | Setting payload |
| `updated_at` | number (ms epoch) | yes | Last update timestamp |

Standard V1 keys:

- `device_id`
- `ui_last_area`
- `solo_preferred_parity` (`odd` or `even`)
- `follower_default_mode` (`follow` or `free`)
- `viewer_display_preset` (used only if app-level day/night presets are supported)

### 5.6 `choir_reconnect_tokens`

| Field | Type | Required | Notes |
|---|---|---|---|
| `session_id` | string | yes | Session identifier (PK) |
| `session_token` | string | yes | Token used for automatic follower reconnect |
| `status` | enum: `active` \| `invalidated` | yes | Token state |
| `last_mode` | enum: `follow` \| `free` | yes | Follower mode to restore on rejoin |
| `created_at` | number (ms epoch) | yes | Creation timestamp |
| `updated_at` | number (ms epoch) | yes | Last update timestamp |

Constraints:

- Token storage is local-only.
- On session end (`SESSION_END`), token must be marked `invalidated` and deleted by cleanup policy.

### 5.7 `sync_checkpoints`

| Field | Type | Required | Notes |
|---|---|---|---|
| `checkpoint_id` | string | yes | Checkpoint identifier |
| `scope_type` | enum: `solo_pair` \| `choir_master` \| `choir_follower` | yes | Scope kind |
| `scope_id` | string | yes | Pair/session identifier |
| `song_id` | string \| null | yes | Current song |
| `song_epoch` | number | yes | Song generation counter |
| `page_index` | number | yes | Current page |
| `page_revision` | number | yes | Page update revision |
| `last_page_change_ts` | number \| null | yes | Used for Solo latest-change-win |
| `last_page_change_sender_id` | string \| null | yes | Used for Solo tie-break support |
| `updated_at` | number (ms epoch) | yes | Last checkpoint timestamp |

Constraints:

- Latest checkpoint per scope is authoritative for reconnect resume.
- Older song epoch checkpoints are stale and must not override newer state.

### 5.8 `stream_cache`

| Field | Type | Required | Notes |
|---|---|---|---|
| `cache_id` | string | yes | Cache identifier |
| `session_id` | string | yes | Choir session link |
| `song_id` | string | yes | Current streamed song |
| `content_ref` | string | yes | Local temporary reference to streamed content |
| `expires_at` | number (ms epoch) | no | Optional TTL marker |
| `created_at` | number (ms epoch) | yes | Creation timestamp |

Constraints:

- Stream cache is temporary and view-only.
- Stream cache must be cleared when session ends.
- Stream cache must not be promoted into permanent library stores (`songs`, `song_assets`) without explicit import flow.

---

## 6. Relationships

- `songs` 1 -> N `song_assets`
- `setlists` 1 -> N `setlist_items`
- `songs` 1 -> N `setlist_items`
- `choir_reconnect_tokens` and `sync_checkpoints` are session-scoped support stores
- `stream_cache` is session-scoped temporary content

---

## 7. Retention and Cleanup Policy

- Library and setlist stores are durable until user deletion.
- `choir_reconnect_tokens`:
  - keep active token for automatic reconnect
  - invalidate and purge after session termination
- `sync_checkpoints`:
  - keep latest checkpoint per scope
  - prune obsolete checkpoints on startup or migration
- `stream_cache`:
  - clear on `SESSION_END`
  - clear on explicit follower leave
  - clear expired entries opportunistically at app startup

---

## 8. Versioning Strategy

- Start at IndexedDB version `1`.
- Every schema change increments DB version by exactly `+1`.
- Each version bump must include:
  - updated `DB_SCHEMA.md`
  - migration artifact in repository history
  - compatibility notes for upgraded stores/indexes

---

## 9. Migration Rules

- Migrations are immutable once committed.
- Migrations are additive-first when possible.
- Destructive changes require explicit data transformation and backup-safe ordering.
- Migration steps must be idempotent from the user perspective (no duplicate logical rows).
- Migration artifacts are tracked in `./db/migrations/sql/`; filenames must be monotonic and immutable.

Recommended filename convention:

- `V{N}__short_description.sql`

Even when runtime persistence is IndexedDB, the repository migration log must remain ordered and auditable.

---

## 10. Integrity Rules (V1)

- No orphan `song_assets` rows (`song_id` must exist in `songs`).
- No orphan `setlist_items` rows (`setlist_id` and `song_id` must exist).
- No duplicate order index inside same song asset sequence.
- No duplicate order index inside same setlist.
- Session-end cleanup must invalidate reconnect token and clear stream cache.

---

## 11. Explicit Non-Goals for Schema V1

- No cloud sync metadata
- No user accounts or permission hierarchy
- No annotations, edits, or crop history
- No permanent storage of streamed Choir content as implicit library import
