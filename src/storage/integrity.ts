import type { MaestralDB } from './maestral_db';
import { db } from './maestral_db';
import { createTimestamp } from './utils';

export interface DuplicateOrderIndex {
  owner_id: string;
  order_index: number;
}

export async function findOrphanSongAssets(dbInstance: MaestralDB = db) {
  const [songs, assets] = await Promise.all([dbInstance.songs.toArray(), dbInstance.song_assets.toArray()]);
  const songIds = new Set(songs.map((song) => song.song_id));
  return assets.filter((asset) => !songIds.has(asset.song_id));
}

export async function findOrphanSetlistItems(dbInstance: MaestralDB = db) {
  const [songs, setlists, items] = await Promise.all([
    dbInstance.songs.toArray(),
    dbInstance.setlists.toArray(),
    dbInstance.setlist_items.toArray(),
  ]);

  const songIds = new Set(songs.map((song) => song.song_id));
  const setlistIds = new Set(setlists.map((setlist) => setlist.setlist_id));

  return items.filter((item) => !songIds.has(item.song_id) || !setlistIds.has(item.setlist_id));
}

export async function findDuplicateSongAssetOrderIndexes(dbInstance: MaestralDB = db): Promise<DuplicateOrderIndex[]> {
  const assets = await dbInstance.song_assets.toArray();
  const seen = new Set<string>();
  const duplicates: DuplicateOrderIndex[] = [];

  for (const asset of assets) {
    const key = `${asset.song_id}:${asset.order_index}`;
    if (seen.has(key)) {
      duplicates.push({ owner_id: asset.song_id, order_index: asset.order_index });
      continue;
    }
    seen.add(key);
  }

  return duplicates;
}

export async function findDuplicateSetlistOrderIndexes(dbInstance: MaestralDB = db): Promise<DuplicateOrderIndex[]> {
  const items = await dbInstance.setlist_items.toArray();
  const seen = new Set<string>();
  const duplicates: DuplicateOrderIndex[] = [];

  for (const item of items) {
    const key = `${item.setlist_id}:${item.order_index}`;
    if (seen.has(key)) {
      duplicates.push({ owner_id: item.setlist_id, order_index: item.order_index });
      continue;
    }
    seen.add(key);
  }

  return duplicates;
}

export async function invalidateSessionAndClearStreamCache(
  sessionId: string,
  dbInstance: MaestralDB = db,
): Promise<void> {
  await dbInstance.transaction(
    'rw',
    dbInstance.choir_reconnect_tokens,
    dbInstance.stream_cache,
    async () => {
      const existing = await dbInstance.choir_reconnect_tokens.get(sessionId);
      if (existing) {
        await dbInstance.choir_reconnect_tokens.put({
          ...existing,
          status: 'invalidated',
          updated_at: createTimestamp(),
        });
        await dbInstance.choir_reconnect_tokens.delete(sessionId);
      }

      await dbInstance.stream_cache.where('session_id').equals(sessionId).delete();
    },
  );
}

export async function clearExpiredStreamCache(dbInstance: MaestralDB = db): Promise<number> {
  const now = createTimestamp();
  const expiredIds = await dbInstance.stream_cache
    .filter((row) => typeof row.expires_at === 'number' && row.expires_at <= now)
    .primaryKeys();

  if (expiredIds.length === 0) {
    return 0;
  }

  await dbInstance.stream_cache.bulkDelete(expiredIds as string[]);
  return expiredIds.length;
}
