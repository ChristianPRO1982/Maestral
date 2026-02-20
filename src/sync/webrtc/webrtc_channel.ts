import {
  createSyncTestEvent,
  encodeSyncTestEvent,
  SYNC_TEST_NEXT,
  SYNC_TEST_PREV,
  type SyncTestEvent,
  type SyncTestEventType,
} from './sync_test_event';
import {
  ensureLocalDataChannel,
  getDataChannel,
  subscribeMessages,
  type WebRtcSnapshot,
} from './webrtc_runtime';

export { SYNC_TEST_NEXT, SYNC_TEST_PREV };
export type { SyncTestEvent, SyncTestEventType, WebRtcSnapshot };

export function openDataChannel(): void {
  ensureLocalDataChannel();
}

export function send(type: SyncTestEventType): SyncTestEvent {
  const channel = getDataChannel();

  if (!channel || channel.readyState !== 'open') {
    throw new Error('DataChannel is not open yet.');
  }

  const event = createSyncTestEvent(type);
  channel.send(encodeSyncTestEvent(event));
  return event;
}

export function onMessage(callback: (event: SyncTestEvent) => void): () => void {
  return subscribeMessages(callback);
}
