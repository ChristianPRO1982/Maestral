import "./style.css";
import { registerSW } from "virtual:pwa-register";

type CommandType = "NEXT" | "PREV";
type ConnectionLabel = "Disconnected" | "Connecting" | "Connected";
type Role = "offerer" | "answerer";

registerSW({ immediate: true });

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root not found.");
}

app.innerHTML = `
  <h1>Maestral P2P Test</h1>

  <h2>1. Connection</h2>
  <div class="row">
    <button id="createOfferBtn" type="button">Create Offer</button>
  </div>
  <label for="offerOutput">Offer SDP (readonly)</label>
  <textarea id="offerOutput" readonly></textarea>

  <label for="offerInput">Paste Offer</label>
  <textarea id="offerInput"></textarea>
  <div class="row">
    <button id="createAnswerBtn" type="button">Create Answer</button>
  </div>

  <label for="answerOutput">Answer SDP (readonly)</label>
  <textarea id="answerOutput" readonly></textarea>

  <label for="answerInput">Paste Answer</label>
  <textarea id="answerInput"></textarea>
  <div class="row">
    <button id="connectBtn" type="button">Connect</button>
  </div>

  <h2>2. Status</h2>
  <div class="status-grid">
    <div>Connection status: <strong id="connectionStatus">Disconnected</strong></div>
    <div>DataChannel status: <strong id="channelStatus">Closed</strong></div>
    <div>Received counter: <strong id="receivedCounter">0</strong></div>
  </div>

  <h2>3. Controls</h2>
  <div class="row">
    <button id="nextBtn" type="button" disabled>NEXT</button>
    <button id="prevBtn" type="button" disabled>PREV</button>
  </div>

  <h2>4. Log</h2>
  <pre id="logOutput"></pre>
`;

const createOfferBtn = getById<HTMLButtonElement>("createOfferBtn");
const createAnswerBtn = getById<HTMLButtonElement>("createAnswerBtn");
const connectBtn = getById<HTMLButtonElement>("connectBtn");
const nextBtn = getById<HTMLButtonElement>("nextBtn");
const prevBtn = getById<HTMLButtonElement>("prevBtn");

const offerOutput = getById<HTMLTextAreaElement>("offerOutput");
const offerInput = getById<HTMLTextAreaElement>("offerInput");
const answerOutput = getById<HTMLTextAreaElement>("answerOutput");
const answerInput = getById<HTMLTextAreaElement>("answerInput");

const connectionStatus = getById<HTMLSpanElement>("connectionStatus");
const channelStatus = getById<HTMLSpanElement>("channelStatus");
const receivedCounter = getById<HTMLSpanElement>("receivedCounter");
const logOutput = getById<HTMLPreElement>("logOutput");

let peerConnection: RTCPeerConnection | null = null;
let dataChannel: RTCDataChannel | null = null;
let role: Role | null = null;
let receivedCount = 0;

function getById<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing element #${id}`);
  }
  return element as T;
}

function nowTimestamp(): string {
  return new Date().toLocaleTimeString("fr-FR", { hour12: false });
}

function writeLog(kind: "Info" | "Error" | "Sent" | "Received", message: string): void {
  const line = `[${nowTimestamp()}] ${kind}: ${message}`;
  logOutput.textContent = `${logOutput.textContent}${line}\n`;
  logOutput.scrollTop = logOutput.scrollHeight;
}

function setConnectionStatus(value: ConnectionLabel): void {
  connectionStatus.textContent = value;
}

function setChannelStatus(value: string): void {
  channelStatus.textContent = value;
}

function setReceivedCounter(value: number): void {
  receivedCounter.textContent = String(value);
}

function canSendCommands(): boolean {
  return dataChannel?.readyState === "open";
}

function refreshControlState(): void {
  const disabled = !canSendCommands();
  nextBtn.disabled = disabled;
  prevBtn.disabled = disabled;
}

function closeExistingConnection(): void {
  if (dataChannel) {
    dataChannel.onopen = null;
    dataChannel.onmessage = null;
    dataChannel.onclose = null;
    dataChannel.close();
  }
  dataChannel = null;

  if (peerConnection) {
    peerConnection.onconnectionstatechange = null;
    peerConnection.ondatachannel = null;
    peerConnection.close();
  }
  peerConnection = null;
  role = null;

  setConnectionStatus("Disconnected");
  setChannelStatus("Closed");
  refreshControlState();
}

function installPeerConnectionListeners(pc: RTCPeerConnection): void {
  pc.onconnectionstatechange = () => {
    const state = pc.connectionState;
    if (state === "connected") {
      setConnectionStatus("Connected");
      return;
    }
    if (state === "connecting" || state === "new") {
      setConnectionStatus("Connecting");
      return;
    }
    setConnectionStatus("Disconnected");
  };
}

function attachDataChannel(channel: RTCDataChannel): void {
  dataChannel = channel;
  setChannelStatus(channel.readyState);
  refreshControlState();

  channel.onopen = () => {
    setChannelStatus("Open");
    refreshControlState();
    writeLog("Info", "DataChannel open.");
  };

  channel.onclose = () => {
    setChannelStatus("Closed");
    refreshControlState();
    writeLog("Info", "DataChannel closed.");
  };

  channel.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data as string) as { type?: unknown };
      if (payload.type !== "NEXT" && payload.type !== "PREV") {
        writeLog("Error", "Unsupported message received.");
        return;
      }

      receivedCount += 1;
      setReceivedCounter(receivedCount);
      writeLog("Received", payload.type);
    } catch {
      writeLog("Error", "Invalid JSON message received.");
    }
  };
}

function createPeerConnection(nextRole: Role): RTCPeerConnection {
  closeExistingConnection();

  role = nextRole;
  const pc = new RTCPeerConnection();
  installPeerConnectionListeners(pc);
  peerConnection = pc;
  setConnectionStatus("Connecting");

  if (nextRole === "answerer") {
    pc.ondatachannel = (event) => {
      attachDataChannel(event.channel);
    };
  }

  return pc;
}

function waitForIceGathering(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === "complete") {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const handleChange = () => {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", handleChange);
        resolve();
      }
    };
    pc.addEventListener("icegatheringstatechange", handleChange);
  });
}

function encodeDescription(desc: RTCSessionDescriptionInit): string {
  return JSON.stringify(
    {
      type: desc.type,
      sdp: desc.sdp
    },
    null,
    2
  );
}

function parseDescription(raw: string): RTCSessionDescriptionInit {
  if (!raw.trim()) {
    throw new Error("SDP input is empty.");
  }

  const parsed = JSON.parse(raw) as { type?: string; sdp?: string };
  if (!parsed.type || !parsed.sdp) {
    throw new Error("Invalid SDP JSON format.");
  }

  if (parsed.type !== "offer" && parsed.type !== "answer") {
    throw new Error("SDP type must be offer or answer.");
  }

  return {
    type: parsed.type,
    sdp: parsed.sdp
  };
}

async function handleCreateOffer(): Promise<void> {
  try {
    const pc = createPeerConnection("offerer");
    const channel = pc.createDataChannel("maestral-control");
    attachDataChannel(channel);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await waitForIceGathering(pc);

    if (!pc.localDescription) {
      throw new Error("Local offer description is missing.");
    }

    offerOutput.value = encodeDescription(pc.localDescription);
    writeLog("Info", "Offer created. Copy it to the other device.");
  } catch (error) {
    setConnectionStatus("Disconnected");
    writeLog("Error", asMessage(error));
  }
}

async function handleCreateAnswer(): Promise<void> {
  try {
    const offerDescription = parseDescription(offerInput.value);
    if (offerDescription.type !== "offer") {
      throw new Error("Paste an offer JSON in 'Paste Offer'.");
    }

    const pc = createPeerConnection("answerer");
    await pc.setRemoteDescription(offerDescription);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await waitForIceGathering(pc);

    if (!pc.localDescription) {
      throw new Error("Local answer description is missing.");
    }

    answerOutput.value = encodeDescription(pc.localDescription);
    writeLog("Info", "Answer created. Copy it back to the offer device.");
  } catch (error) {
    setConnectionStatus("Disconnected");
    writeLog("Error", asMessage(error));
  }
}

async function handleConnect(): Promise<void> {
  try {
    if (!peerConnection || role !== "offerer") {
      throw new Error("Create an offer on this device before connecting.");
    }

    const answerDescription = parseDescription(answerInput.value);
    if (answerDescription.type !== "answer") {
      throw new Error("Paste an answer JSON in 'Paste Answer'.");
    }

    await peerConnection.setRemoteDescription(answerDescription);
    writeLog("Info", "Remote answer accepted. Waiting for channel open.");
  } catch (error) {
    writeLog("Error", asMessage(error));
  }
}

function sendCommand(type: CommandType): void {
  if (!dataChannel || dataChannel.readyState !== "open") {
    writeLog("Error", "DataChannel is not open.");
    refreshControlState();
    return;
  }

  const message = JSON.stringify({ type });
  dataChannel.send(message);
  writeLog("Sent", type);
}

function asMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}

createOfferBtn.addEventListener("click", () => {
  void handleCreateOffer();
});

createAnswerBtn.addEventListener("click", () => {
  void handleCreateAnswer();
});

connectBtn.addEventListener("click", () => {
  void handleConnect();
});

nextBtn.addEventListener("click", () => {
  sendCommand("NEXT");
});

prevBtn.addEventListener("click", () => {
  sendCommand("PREV");
});

setConnectionStatus("Disconnected");
setChannelStatus("Closed");
setReceivedCounter(receivedCount);
refreshControlState();
