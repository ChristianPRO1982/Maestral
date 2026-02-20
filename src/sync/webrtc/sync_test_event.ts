export const SYNC_TEST_NEXT = 'SYNC_TEST_NEXT';
export const SYNC_TEST_PREV = 'SYNC_TEST_PREV';

const VALID_SYNC_EVENT_TYPES = [SYNC_TEST_NEXT, SYNC_TEST_PREV] as const;

export type SyncTestEventType = (typeof VALID_SYNC_EVENT_TYPES)[number];

export interface SyncTestEvent {
  type: SyncTestEventType;
  ts: number;
}

function isSyncTestEventType(value: string): value is SyncTestEventType {
  return VALID_SYNC_EVENT_TYPES.includes(value as SyncTestEventType);
}

export function createSyncTestEvent(type: SyncTestEventType, ts = Date.now()): SyncTestEvent {
  return { type, ts };
}

export function encodeSyncTestEvent(event: SyncTestEvent): string {
  return JSON.stringify(event);
}

export function decodeSyncTestEvent(raw: string): SyncTestEvent {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Malformed sync event: invalid JSON payload.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Malformed sync event: expected an object payload.');
  }

  const record = parsed as Record<string, unknown>;
  const eventType = record.type;
  const timestamp = record.ts;

  if (typeof eventType !== 'string' || !isSyncTestEventType(eventType)) {
    throw new Error('Malformed sync event: unsupported event type.');
  }

  if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) {
    throw new Error('Malformed sync event: timestamp must be a finite number.');
  }

  return {
    type: eventType,
    ts: timestamp,
  };
}
