export type SongSourceKind = 'pdf' | 'image';
export type ReconnectTokenStatus = 'active' | 'invalidated';
export type FollowerMode = 'follow' | 'free';
export type SyncScopeType = 'solo_pair' | 'choir_master' | 'choir_follower';

export interface SongRow {
  song_id: string;
  title: string;
  title_normalized: string;
  source_kind: SongSourceKind;
  page_count?: number;
  created_at: number;
  updated_at: number;
}

export interface SongAssetRow {
  asset_id: string;
  song_id: string;
  asset_kind: SongSourceKind;
  order_index: number;
  storage_ref: string;
  mime_type: string;
  created_at: number;
}

export interface SetlistRow {
  setlist_id: string;
  name: string;
  name_normalized: string;
  created_at: number;
  updated_at: number;
}

export interface SetlistItemRow {
  item_id: string;
  setlist_id: string;
  song_id: string;
  order_index: number;
  created_at: number;
}

export interface AppSettingRow {
  key: string;
  value: unknown;
  updated_at: number;
}

export interface ChoirReconnectTokenRow {
  session_id: string;
  session_token: string;
  status: ReconnectTokenStatus;
  last_mode: FollowerMode;
  created_at: number;
  updated_at: number;
}

export interface SyncCheckpointRow {
  checkpoint_id: string;
  scope_type: SyncScopeType;
  scope_id: string;
  song_id: string | null;
  song_epoch: number;
  page_index: number;
  page_revision: number;
  last_page_change_ts: number | null;
  last_page_change_sender_id: string | null;
  updated_at: number;
}

export interface StreamCacheRow {
  cache_id: string;
  session_id: string;
  song_id: string;
  content_ref: string;
  expires_at?: number;
  created_at: number;
}
