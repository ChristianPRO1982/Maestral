import {
  createPeerConnection,
  ensureLocalDataChannel,
  getPeerConnection,
  getSnapshot,
  resetRuntime,
  setHarnessConnectionState,
  subscribeSnapshot,
  type WebRtcSnapshot,
} from './webrtc_runtime';

type SignalingBlobType = 'offer' | 'answer';
const ICE_GATHERING_TIMEOUT_MS = 10_000;

function waitForIceGatheringComplete(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === 'complete') {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      pc.removeEventListener('icegatheringstatechange', onChange);
      reject(new Error(`ICE gathering timed out after ${ICE_GATHERING_TIMEOUT_MS}ms.`));
    }, ICE_GATHERING_TIMEOUT_MS);

    const onChange = (): void => {
      if (pc.iceGatheringState !== 'complete') {
        return;
      }

      pc.removeEventListener('icegatheringstatechange', onChange);
      window.clearTimeout(timeoutId);
      resolve();
    };

    pc.addEventListener('icegatheringstatechange', onChange);
  });
}

function serializeDescription(description: RTCSessionDescriptionInit): string {
  return JSON.stringify({
    type: description.type,
    sdp: description.sdp,
  });
}

function parseSignalingBlob(rawBlob: string, expectedType: SignalingBlobType): RTCSessionDescriptionInit {
  const normalizedBlob = rawBlob.trim();

  if (!normalizedBlob) {
    throw new Error('Remote SDP is empty. Paste a valid offer/answer JSON payload.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(normalizedBlob);
  } catch {
    throw new Error('Remote SDP is not valid JSON. Expected {"type":"offer|answer","sdp":"..."}');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Remote SDP payload must be a JSON object.');
  }

  const value = parsed as Record<string, unknown>;
  const type = value.type;
  const sdp = value.sdp;

  if (type !== expectedType) {
    throw new Error(`Remote SDP must be of type "${expectedType}".`);
  }

  if (typeof sdp !== 'string' || sdp.trim().length === 0) {
    throw new Error('Remote SDP is missing the "sdp" field.');
  }

  return {
    type: expectedType,
    sdp,
  };
}

export async function createOffer(): Promise<string> {
  resetRuntime();

  const pc = createPeerConnection();
  ensureLocalDataChannel();

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await waitForIceGatheringComplete(pc);

  if (!pc.localDescription) {
    throw new Error('Unable to produce local offer SDP.');
  }

  setHarnessConnectionState('offer-created');
  return serializeDescription(pc.localDescription);
}

export async function acceptOfferAndCreateAnswer(offerSdp: string): Promise<string> {
  resetRuntime();

  const pc = createPeerConnection();
  const offer = parseSignalingBlob(offerSdp, 'offer');

  await pc.setRemoteDescription(offer);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  await waitForIceGatheringComplete(pc);

  if (!pc.localDescription) {
    throw new Error('Unable to produce local answer SDP.');
  }

  setHarnessConnectionState('answer-created');
  return serializeDescription(pc.localDescription);
}

export async function acceptAnswer(answerSdp: string): Promise<void> {
  const pc = getPeerConnection();

  if (!pc) {
    throw new Error('No active offer context. Create an offer first.');
  }

  const answer = parseSignalingBlob(answerSdp, 'answer');
  await pc.setRemoteDescription(answer);
}

export function resetSession(): void {
  resetRuntime();
}

export function getWebRtcSnapshot(): WebRtcSnapshot {
  return getSnapshot();
}

export function subscribeWebRtcSnapshot(listener: (snapshot: WebRtcSnapshot) => void): () => void {
  return subscribeSnapshot(listener);
}
