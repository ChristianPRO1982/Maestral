import type { MaestralDB } from '../maestral_db';
import { db } from '../maestral_db';
import type { SongRow, SongSourceKind } from '../models';
import { createStorageId, createTimestamp, normalizeField } from '../utils';

export interface CreateSongInput {
  title: string;
  source_kind: SongSourceKind;
  page_count?: number;
}

export interface UpdateSongInput {
  title?: string;
  page_count?: number;
}

export async function createSong(input: CreateSongInput, dbInstance: MaestralDB = db): Promise<SongRow> {
  const timestamp = createTimestamp();
  const row: SongRow = {
    song_id: createStorageId(),
    title: input.title,
    title_normalized: normalizeField(input.title),
    source_kind: input.source_kind,
    page_count: input.page_count,
    created_at: timestamp,
    updated_at: timestamp,
  };

  await dbInstance.songs.add(row);
  return row;
}

export async function updateSong(
  songId: string,
  input: UpdateSongInput,
  dbInstance: MaestralDB = db,
): Promise<SongRow> {
  const existing = await dbInstance.songs.get(songId);

  if (!existing) {
    throw new Error(`Song ${songId} not found`);
  }

  const nextTitle = input.title ?? existing.title;
  const updated: SongRow = {
    ...existing,
    title: nextTitle,
    title_normalized: normalizeField(nextTitle),
    page_count: input.page_count ?? existing.page_count,
    updated_at: createTimestamp(),
  };

  await dbInstance.songs.put(updated);
  return updated;
}

export async function getSong(songId: string, dbInstance: MaestralDB = db): Promise<SongRow | undefined> {
  return dbInstance.songs.get(songId);
}

export async function listSongs(dbInstance: MaestralDB = db): Promise<SongRow[]> {
  return dbInstance.songs.orderBy('updated_at').reverse().toArray();
}
