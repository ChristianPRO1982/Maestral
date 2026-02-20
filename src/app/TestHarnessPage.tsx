import { useEffect, useMemo, useState } from 'react';
import { getDeviceRole } from '../config/device_role';
import {
  SYNC_TEST_NEXT,
  SYNC_TEST_PREV,
  onMessage,
  send,
  type SyncTestEventType,
} from '../sync/webrtc/webrtc_channel';
import {
  acceptAnswer,
  acceptOfferAndCreateAnswer,
  createOffer,
  getWebRtcSnapshot,
  resetSession,
  subscribeWebRtcSnapshot,
} from '../sync/webrtc/webrtc_signaling';

interface HarnessLogEntry {
  ts: number;
  message: string;
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString();
}

export function TestHarnessPage(): JSX.Element {
  const role = useMemo(() => getDeviceRole(), []);
  const [snapshot, setSnapshot] = useState(getWebRtcSnapshot());
  const [localSdp, setLocalSdp] = useState('');
  const [remoteSdp, setRemoteSdp] = useState('');
  const [lastReceivedEvent, setLastReceivedEvent] = useState('none');
  const [logs, setLogs] = useState<HarnessLogEntry[]>([]);
  const [uiError, setUiError] = useState<string | null>(null);

  const instancePort = window.location.port || '80';
  const buildInfo = `${import.meta.env.MODE} | ${import.meta.env.DEV ? 'dev' : 'prod'}`;

  function appendLog(message: string): void {
    setLogs((previousLogs) => [{ ts: Date.now(), message }, ...previousLogs].slice(0, 50));
  }

  function registerError(error: unknown): void {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    setUiError(message);
    appendLog(`Error: ${message}`);
  }

  async function copyLocalSdp(): Promise<void> {
    if (!localSdp) {
      setUiError('Nothing to copy yet. Generate an offer or answer first.');
      return;
    }

    if (!navigator.clipboard) {
      setUiError('Clipboard API is unavailable in this browser context.');
      return;
    }

    try {
      await navigator.clipboard.writeText(localSdp);
      setUiError(null);
      appendLog('Local SDP copied to clipboard.');
    } catch (error: unknown) {
      registerError(error);
    }
  }

  async function pasteRemoteSdpFromClipboard(): Promise<void> {
    if (!navigator.clipboard) {
      setUiError('Clipboard API is unavailable in this browser context.');
      return;
    }

    try {
      const value = await navigator.clipboard.readText();
      setRemoteSdp(value);
      setUiError(null);
      appendLog('Remote SDP pasted from clipboard.');
    } catch (error: unknown) {
      registerError(error);
    }
  }

  async function handleCreateOffer(): Promise<void> {
    try {
      const offer = await createOffer();
      setLocalSdp(offer);
      setUiError(null);
      appendLog('Offer created.');
    } catch (error: unknown) {
      registerError(error);
    }
  }

  async function handleCreateAnswer(): Promise<void> {
    try {
      const answer = await acceptOfferAndCreateAnswer(remoteSdp);
      setLocalSdp(answer);
      setUiError(null);
      appendLog('Answer created from remote offer.');
    } catch (error: unknown) {
      registerError(error);
    }
  }

  async function handleAcceptAnswer(): Promise<void> {
    try {
      await acceptAnswer(remoteSdp);
      setUiError(null);
      appendLog('Remote answer accepted.');
    } catch (error: unknown) {
      registerError(error);
    }
  }

  function handleSendEvent(type: SyncTestEventType): void {
    try {
      const event = send(type);
      setUiError(null);
      appendLog(`Sent ${event.type}.`);
    } catch (error: unknown) {
      registerError(error);
    }
  }

  function handleResetSession(): void {
    resetSession();
    setLocalSdp('');
    setRemoteSdp('');
    setLastReceivedEvent('none');
    setUiError(null);
    setLogs([]);
  }

  useEffect(() => {
    return subscribeWebRtcSnapshot((nextSnapshot) => {
      setSnapshot(nextSnapshot);
      if (nextSnapshot.lastError) {
        setUiError(nextSnapshot.lastError);
      }
    });
  }, []);

  useEffect(() => {
    return onMessage((event) => {
      setLastReceivedEvent(`${event.type} @ ${formatTimestamp(event.ts)}`);
      appendLog(`Received ${event.type}.`);
    });
  }, []);

  return (
    <main className="app-shell harness-shell">
      <section className="harness-card">
        <h1>Maestral Test Harness</h1>
        <p>Manual WebRTC pairing helper for local MASTER/SLAVE validation.</p>

        <div className="harness-grid">
          <section className="harness-panel">
            <h2>Instance</h2>
            <p>
              <strong>Role:</strong> {role}
            </p>
            <p>
              <strong>Port:</strong> {instancePort}
            </p>
            <p>
              <strong>Build:</strong> {buildInfo}
            </p>
            <p>
              <strong>URL:</strong> {window.location.origin}
            </p>
          </section>

          <section className="harness-panel">
            <h2>Status</h2>
            <p>
              <strong>Connection:</strong> {snapshot.connectionState}
            </p>
            <p>
              <strong>Peer state:</strong> {snapshot.peerConnectionState}
            </p>
            <p>
              <strong>ICE:</strong> {snapshot.iceConnectionState}
            </p>
            <p>
              <strong>Signaling:</strong> {snapshot.signalingState}
            </p>
            <p>
              <strong>DataChannel:</strong> {snapshot.dataChannelState}
            </p>
            <p>
              <strong>Last received event:</strong> {lastReceivedEvent}
            </p>
            {uiError ? <p className="harness-error">{uiError}</p> : null}
          </section>

          <section className="harness-panel">
            <h2>Signaling</h2>
            <div className="harness-actions">
              <button type="button" onClick={handleCreateOffer}>
                Create Offer
              </button>
              <button type="button" onClick={handleCreateAnswer}>
                Create Answer
              </button>
              <button type="button" onClick={handleAcceptAnswer}>
                Accept Answer / Connect
              </button>
              <button type="button" onClick={handleResetSession}>
                Reset Session
              </button>
            </div>

            <label htmlFor="local-sdp">Local SDP</label>
            <textarea id="local-sdp" value={localSdp} readOnly rows={7} />
            <button type="button" onClick={copyLocalSdp}>
              Copy Local SDP
            </button>

            <label htmlFor="remote-sdp">Remote SDP</label>
            <textarea
              id="remote-sdp"
              value={remoteSdp}
              onChange={(event) => setRemoteSdp(event.target.value)}
              rows={7}
            />
            <button type="button" onClick={pasteRemoteSdpFromClipboard}>
              Paste Remote SDP from Clipboard
            </button>
          </section>

          <section className="harness-panel">
            <h2>Send Events</h2>
            <div className="harness-actions">
              <button type="button" onClick={() => handleSendEvent(SYNC_TEST_NEXT)}>
                Next Page
              </button>
              <button type="button" onClick={() => handleSendEvent(SYNC_TEST_PREV)}>
                Prev Page
              </button>
            </div>

            <h3>Logs</h3>
            <ul className="harness-log-list">
              {logs.length === 0 ? <li>No logs yet.</li> : null}
              {logs.map((entry, index) => (
                <li key={`${entry.ts}-${index}`}>
                  [{formatTimestamp(entry.ts)}] {entry.message}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>
    </main>
  );
}
