import 'fake-indexeddb/auto';

import { afterEach, describe, expect, it } from 'vitest';
import { MAESTRAL_DB_VERSION, MaestralDB } from './maestral_db';
import { createSetlist, createSetlistItem, listSetlistItems } from './repos/setlists_repo';
import { createSong, getSong } from './repos/songs_repo';

const openedDatabases: MaestralDB[] = [];

function createTestDb(): MaestralDB {
  const instance = new MaestralDB(`maestral-test-${Math.random().toString(36).slice(2, 10)}`);
  openedDatabases.push(instance);
  return instance;
}

afterEach(async () => {
  await Promise.all(
    openedDatabases.splice(0).map(async (database) => {
      database.close();
      await database.delete();
    }),
  );
});

describe('MaestralDB smoke tests', () => {
  it('opens database with schema version 1', async () => {
    const testDb = createTestDb();

    await testDb.open();

    expect(testDb.verno).toBe(MAESTRAL_DB_VERSION);
  });

  it('inserts and reads a song', async () => {
    const testDb = createTestDb();
    const created = await createSong(
      {
        title: 'Kyrie',
        source_kind: 'pdf',
        page_count: 8,
      },
      testDb,
    );

    const fetched = await getSong(created.song_id, testDb);

    expect(fetched?.title).toBe('Kyrie');
    expect(fetched?.source_kind).toBe('pdf');
  });

  it('inserts and reads a setlist item', async () => {
    const testDb = createTestDb();
    const song = await createSong(
      {
        title: 'Agnus Dei',
        source_kind: 'image',
      },
      testDb,
    );
    const setlist = await createSetlist({ name: 'Messe du dimanche' }, testDb);

    await createSetlistItem(
      {
        setlist_id: setlist.setlist_id,
        song_id: song.song_id,
      },
      testDb,
    );

    const items = await listSetlistItems(setlist.setlist_id, testDb);

    expect(items).toHaveLength(1);
    expect(items[0]?.song_id).toBe(song.song_id);
  });
});
