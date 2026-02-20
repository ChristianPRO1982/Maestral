import Dexie, { type Table } from 'dexie';
import type {
  AppSettingRow,
  ChoirReconnectTokenRow,
  SetlistItemRow,
  SetlistRow,
  SongAssetRow,
  SongRow,
  StreamCacheRow,
  SyncCheckpointRow,
} from './models';

export const MAESTRAL_DB_NAME = 'maestral';
export const MAESTRAL_DB_VERSION = 1;

export class MaestralDB extends Dexie {
  songs!: Table<SongRow, string>;
  song_assets!: Table<SongAssetRow, string>;
  setlists!: Table<SetlistRow, string>;
  setlist_items!: Table<SetlistItemRow, string>;
  app_settings!: Table<AppSettingRow, string>;
  choir_reconnect_tokens!: Table<ChoirReconnectTokenRow, string>;
  sync_checkpoints!: Table<SyncCheckpointRow, string>;
  stream_cache!: Table<StreamCacheRow, string>;

  constructor(dbName: string = MAESTRAL_DB_NAME) {
    super(dbName);

    this.version(MAESTRAL_DB_VERSION).stores({
      songs: 'song_id,title_normalized,source_kind,updated_at',
      song_assets: 'asset_id,song_id,&[song_id+order_index],asset_kind',
      setlists: 'setlist_id,name_normalized,updated_at',
      setlist_items: 'item_id,setlist_id,&[setlist_id+order_index],song_id',
      app_settings: 'key',
      choir_reconnect_tokens: 'session_id,status,updated_at',
      sync_checkpoints: 'checkpoint_id,scope_type,scope_id,updated_at',
      stream_cache: 'cache_id,session_id,song_id,expires_at',
    });
  }
}

export const db = new MaestralDB();
