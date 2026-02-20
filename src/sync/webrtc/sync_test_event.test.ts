import { describe, expect, it } from 'vitest';
import {
  decodeSyncTestEvent,
  encodeSyncTestEvent,
  SYNC_TEST_NEXT,
  type SyncTestEvent,
} from './sync_test_event';

describe('sync test message codec', () => {
  it('encodes and decodes a sync event payload', () => {
    const event: SyncTestEvent = {
      type: SYNC_TEST_NEXT,
      ts: 1735689600000,
    };

    const encoded = encodeSyncTestEvent(event);
    const decoded = decodeSyncTestEvent(encoded);

    expect(decoded).toEqual(event);
  });

  it('rejects unknown event types', () => {
    const invalidPayload = JSON.stringify({
      type: 'SYNC_TEST_UNKNOWN',
      ts: 1735689600000,
    });

    expect(() => decodeSyncTestEvent(invalidPayload)).toThrow('unsupported event type');
  });
});
