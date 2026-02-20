import { decodeSyncTestEvent, type SyncTestEvent } from './sync_test_event';

export type HarnessConnectionState =
  | 'idle'
  | 'offer-created'
  | 'answer-created'
  | 'connected'
  | 'disconnected';

export interface WebRtcSnapshot {
  connectionState: HarnessConnectionState;
  iceConnectionState: RTCIceConnectionState;
  peerConnectionState: RTCPeerConnectionState;
  signalingState: RTCSignalingState;
  dataChannelState: RTCDataChannelState | 'closed';
  lastError: string | null;
}

type SnapshotListener = (snapshot: WebRtcSnapshot) => void;
type MessageListener = (event: SyncTestEvent) => void;

const snapshotListeners = new Set<SnapshotListener>();
const messageListeners = new Set<MessageListener>();

let peerConnection: RTCPeerConnection | null = null;
let dataChannel: RTCDataChannel | null = null;

let snapshot: WebRtcSnapshot = {
  connectionState: 'idle',
  iceConnectionState: 'new',
  peerConnectionState: 'new',
  signalingState: 'stable',
  dataChannelState: 'closed',
  lastError: null,
};

function notifySnapshotListeners(): void {
  snapshotListeners.forEach((listener) => listener(snapshot));
}

function updateSnapshot(patch: Partial<WebRtcSnapshot>): void {
  snapshot = { ...snapshot, ...patch };
  notifySnapshotListeners();
}

function mapPeerConnectionStateToHarnessState(
  pcState: RTCPeerConnectionState,
): HarnessConnectionState | null {
  if (pcState === 'connected') {
    return 'connected';
  }

  if (pcState === 'disconnected' || pcState === 'failed' || pcState === 'closed') {
    return 'disconnected';
  }

  return null;
}

function bindDataChannel(channel: RTCDataChannel): void {
  dataChannel = channel;
  updateSnapshot({
    dataChannelState: channel.readyState,
  });

  channel.onopen = () => {
    if (dataChannel !== channel) {
      return;
    }

    updateSnapshot({
      dataChannelState: channel.readyState,
    });
  };

  channel.onclose = () => {
    if (dataChannel !== channel) {
      return;
    }

    updateSnapshot({
      dataChannelState: 'closed',
    });
  };

  channel.onerror = () => {
    if (dataChannel !== channel) {
      return;
    }

    updateSnapshot({
      lastError: 'DataChannel error detected.',
    });
  };

  channel.onmessage = (event) => {
    if (dataChannel !== channel) {
      return;
    }

    if (typeof event.data !== 'string') {
      return;
    }

    try {
      const parsed = decodeSyncTestEvent(event.data);
      messageListeners.forEach((listener) => listener(parsed));
      updateSnapshot({
        lastError: null,
      });
    } catch (error: unknown) {
      updateSnapshot({
        lastError: error instanceof Error ? error.message : 'Unable to decode received event.',
      });
    }
  };
}

export function getPeerConnection(): RTCPeerConnection | null {
  return peerConnection;
}

export function getDataChannel(): RTCDataChannel | null {
  return dataChannel;
}

export function createPeerConnection(): RTCPeerConnection {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  if (dataChannel) {
    dataChannel.close();
    dataChannel = null;
  }

  const pc = new RTCPeerConnection();
  peerConnection = pc;

  updateSnapshot({
    connectionState: 'idle',
    iceConnectionState: pc.iceConnectionState,
    peerConnectionState: pc.connectionState,
    signalingState: pc.signalingState,
    dataChannelState: 'closed',
    lastError: null,
  });

  pc.onconnectionstatechange = () => {
    if (peerConnection !== pc) {
      return;
    }

    const harnessState = mapPeerConnectionStateToHarnessState(pc.connectionState);
    updateSnapshot({
      peerConnectionState: pc.connectionState,
      connectionState: harnessState ?? snapshot.connectionState,
    });
  };

  pc.oniceconnectionstatechange = () => {
    if (peerConnection !== pc) {
      return;
    }

    updateSnapshot({
      iceConnectionState: pc.iceConnectionState,
    });
  };

  pc.onsignalingstatechange = () => {
    if (peerConnection !== pc) {
      return;
    }

    updateSnapshot({
      signalingState: pc.signalingState,
    });
  };

  pc.ondatachannel = (event) => {
    if (peerConnection !== pc) {
      return;
    }

    bindDataChannel(event.channel);
  };

  return pc;
}

export function ensureLocalDataChannel(): RTCDataChannel {
  if (!peerConnection) {
    throw new Error('PeerConnection is not initialized.');
  }

  if (dataChannel) {
    return dataChannel;
  }

  const channel = peerConnection.createDataChannel('maestral-sync-test', {
    ordered: true,
  });
  bindDataChannel(channel);
  return channel;
}

export function setHarnessConnectionState(state: HarnessConnectionState): void {
  updateSnapshot({
    connectionState: state,
  });
}

export function getSnapshot(): WebRtcSnapshot {
  return snapshot;
}

export function subscribeSnapshot(listener: SnapshotListener): () => void {
  snapshotListeners.add(listener);
  listener(snapshot);

  return () => {
    snapshotListeners.delete(listener);
  };
}

export function subscribeMessages(listener: MessageListener): () => void {
  messageListeners.add(listener);
  return () => {
    messageListeners.delete(listener);
  };
}

export function resetRuntime(): void {
  if (dataChannel) {
    dataChannel.close();
    dataChannel = null;
  }

  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  updateSnapshot({
    connectionState: 'idle',
    iceConnectionState: 'new',
    peerConnectionState: 'new',
    signalingState: 'stable',
    dataChannelState: 'closed',
    lastError: null,
  });
}
