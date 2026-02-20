import type { MaestralDB } from '../maestral_db';
import { db } from '../maestral_db';
import type { SetlistItemRow, SetlistRow } from '../models';
import { createStorageId, createTimestamp, normalizeField } from '../utils';

export interface CreateSetlistInput {
  name: string;
}

export interface UpdateSetlistInput {
  name?: string;
}

export interface CreateSetlistItemInput {
  setlist_id: string;
  song_id: string;
  order_index?: number;
}

export async function createSetlist(input: CreateSetlistInput, dbInstance: MaestralDB = db): Promise<SetlistRow> {
  const timestamp = createTimestamp();
  const row: SetlistRow = {
    setlist_id: createStorageId(),
    name: input.name,
    name_normalized: normalizeField(input.name),
    created_at: timestamp,
    updated_at: timestamp,
  };

  await dbInstance.setlists.add(row);
  return row;
}

export async function updateSetlist(
  setlistId: string,
  input: UpdateSetlistInput,
  dbInstance: MaestralDB = db,
): Promise<SetlistRow> {
  const existing = await dbInstance.setlists.get(setlistId);

  if (!existing) {
    throw new Error(`Setlist ${setlistId} not found`);
  }

  const nextName = input.name ?? existing.name;
  const updated: SetlistRow = {
    ...existing,
    name: nextName,
    name_normalized: normalizeField(nextName),
    updated_at: createTimestamp(),
  };

  await dbInstance.setlists.put(updated);
  return updated;
}

export async function getSetlist(setlistId: string, dbInstance: MaestralDB = db): Promise<SetlistRow | undefined> {
  return dbInstance.setlists.get(setlistId);
}

export async function listSetlists(dbInstance: MaestralDB = db): Promise<SetlistRow[]> {
  return dbInstance.setlists.orderBy('updated_at').reverse().toArray();
}

export async function createSetlistItem(
  input: CreateSetlistItemInput,
  dbInstance: MaestralDB = db,
): Promise<SetlistItemRow> {
  const orderIndex =
    input.order_index ?? (await dbInstance.setlist_items.where('setlist_id').equals(input.setlist_id).count());

  const row: SetlistItemRow = {
    item_id: createStorageId(),
    setlist_id: input.setlist_id,
    song_id: input.song_id,
    order_index: orderIndex,
    created_at: createTimestamp(),
  };

  await dbInstance.setlist_items.add(row);
  return row;
}

export async function listSetlistItems(
  setlistId: string,
  dbInstance: MaestralDB = db,
): Promise<SetlistItemRow[]> {
  return dbInstance.setlist_items.where('setlist_id').equals(setlistId).sortBy('order_index');
}
