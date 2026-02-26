import "./style.css";
import { registerSW } from "virtual:pwa-register";

type CommandType = "NEXT" | "PREV";
type ConnectionLabel = "Disconnected" | "Connecting" | "Connected";
type SignalingRole = "offerer" | "answerer";
type DeviceRole = "master" | "slave";
type ScanTarget = "offer" | "answer";
type QRCodeLibrary = {
  toDataURL(
    text: string,
    options?: { errorCorrectionLevel?: "L" | "M" | "Q" | "H"; margin?: number; width?: number }
  ): Promise<string>;
};
type BarcodeDetectorResult = { rawValue?: string };
type BarcodeDetectorInstance = { detect(source: ImageBitmapSource): Promise<BarcodeDetectorResult[]> };
type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorInstance;
type WindowWithOptionalAPIs = Window & {
  QRCode?: QRCodeLibrary;
  BarcodeDetector?: BarcodeDetectorCtor;
};

const ROLE_STORAGE_KEY = "maestral_p2p_role";
const QR_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js";

registerSW({ immediate: true });

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root not found.");
}

app.innerHTML = `
  <h1>Maestral P2P Test</h1>

  <h2>0. Device Role</h2>
  <div class="row">
    <label class="inline-option" for="roleMaster">
      <input id="roleMaster" type="radio" name="deviceRole" value="master">
      Master (Offer side)
    </label>
    <label class="inline-option" for="roleSlave">
      <input id="roleSlave" type="radio" name="deviceRole" value="slave">
      Slave (Answer side)
    </label>
    <button id="resetSessionBtn" type="button">Reset Session</button>
  </div>
  <div>Saved role: <strong id="roleStatus"></strong></div>
  <p class="hint" id="flowHint"></p>

  <h2>1. Connection (Copy/Paste)</h2>
  <div class="row">
    <button id="createOfferBtn" type="button">Create Offer</button>
    <button id="copyOfferBtn" type="button">Copy Offer</button>
  </div>
  <label for="offerOutput">Offer SDP (readonly)</label>
  <textarea id="offerOutput" readonly></textarea>
  <div class="qr-box">
    <div>Offer QR</div>
    <img id="offerQrImage" class="qr-image" alt="Offer QR code" hidden />
  </div>

  <label for="offerInput">Paste Offer</label>
  <textarea id="offerInput"></textarea>
  <div class="row">
    <button id="createAnswerBtn" type="button">Create Answer</button>
    <button id="scanOfferQrBtn" type="button">Scan Offer QR</button>
  </div>

  <div class="row">
    <button id="copyAnswerBtn" type="button">Copy Answer</button>
  </div>
  <label for="answerOutput">Answer SDP (readonly)</label>
  <textarea id="answerOutput" readonly></textarea>
  <div class="qr-box">
    <div>Answer QR</div>
    <img id="answerQrImage" class="qr-image" alt="Answer QR code" hidden />
  </div>

  <label for="answerInput">Paste Answer</label>
  <textarea id="answerInput"></textarea>
  <div class="row">
    <button id="connectBtn" type="button">Connect</button>
    <button id="scanAnswerQrBtn" type="button">Scan Answer QR</button>
  </div>

  <div id="scannerPanel" hidden>
    <video id="scannerVideo" autoplay muted playsinline></video>
    <div class="row">
      <button id="stopScanBtn" type="button">Stop Scan</button>
    </div>
  </div>
  <div id="scanStatus" class="hint"></div>

  <div id="qrStatus" class="hint"></div>
  <div class="hint">QR mode is optional. Copy/paste always remains available.</div>

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
const resetSessionBtn = getById<HTMLButtonElement>("resetSessionBtn");
const copyOfferBtn = getById<HTMLButtonElement>("copyOfferBtn");
const copyAnswerBtn = getById<HTMLButtonElement>("copyAnswerBtn");
const scanOfferQrBtn = getById<HTMLButtonElement>("scanOfferQrBtn");
const scanAnswerQrBtn = getById<HTMLButtonElement>("scanAnswerQrBtn");
const stopScanBtn = getById<HTMLButtonElement>("stopScanBtn");
const nextBtn = getById<HTMLButtonElement>("nextBtn");
const prevBtn = getById<HTMLButtonElement>("prevBtn");

const roleMaster = getById<HTMLInputElement>("roleMaster");
const roleSlave = getById<HTMLInputElement>("roleSlave");

const offerOutput = getById<HTMLTextAreaElement>("offerOutput");
const offerInput = getById<HTMLTextAreaElement>("offerInput");
const answerOutput = getById<HTMLTextAreaElement>("answerOutput");
const answerInput = getById<HTMLTextAreaElement>("answerInput");
const offerQrImage = getById<HTMLImageElement>("offerQrImage");
const answerQrImage = getById<HTMLImageElement>("answerQrImage");
const scannerPanel = getById<HTMLDivElement>("scannerPanel");
const scannerVideo = getById<HTMLVideoElement>("scannerVideo");
const scanStatus = getById<HTMLDivElement>("scanStatus");
const qrStatus = getById<HTMLDivElement>("qrStatus");

const connectionStatus = getById<HTMLSpanElement>("connectionStatus");
const channelStatus = getById<HTMLSpanElement>("channelStatus");
const receivedCounter = getById<HTMLSpanElement>("receivedCounter");
const roleStatus = getById<HTMLSpanElement>("roleStatus");
const flowHint = getById<HTMLParagraphElement>("flowHint");
const logOutput = getById<HTMLPreElement>("logOutput");

let peerConnection: RTCPeerConnection | null = null;
let dataChannel: RTCDataChannel | null = null;
let signalingRole: SignalingRole | null = null;
let deviceRole: DeviceRole = loadStoredRole();
let receivedCount = 0;
let qrLibraryPromise: Promise<QRCodeLibrary | null> | null = null;
let activeScanStream: MediaStream | null = null;
let activeScanFrame: number | null = null;
let activeScanTarget: ScanTarget | null = null;
let scanBusy = false;

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

function setScanStatus(message: string): void {
  scanStatus.textContent = message;
}

function setQrStatus(message: string): void {
  qrStatus.textContent = message;
}

function loadStoredRole(): DeviceRole {
  const role = localStorage.getItem(ROLE_STORAGE_KEY);
  if (role === "master" || role === "slave") {
    return role;
  }
  return "master";
}

function saveStoredRole(role: DeviceRole): void {
  localStorage.setItem(ROLE_STORAGE_KEY, role);
}

function updateRoleUI(): void {
  roleMaster.checked = deviceRole === "master";
  roleSlave.checked = deviceRole === "slave";
  roleStatus.textContent = deviceRole;

  if (deviceRole === "master") {
    flowHint.textContent =
      "Master flow: Create Offer -> copy to slave -> paste Answer -> Connect.";
    return;
  }

  flowHint.textContent = "Slave flow: Paste Offer -> Create Answer -> copy back to master.";
}

function canSendCommands(): boolean {
  return dataChannel?.readyState === "open";
}

function refreshControlState(): void {
  const disabled = !canSendCommands();
  nextBtn.disabled = disabled;
  prevBtn.disabled = disabled;
}

function canConnectNow(): boolean {
  return (
    deviceRole === "master" &&
    peerConnection !== null &&
    signalingRole === "offerer" &&
    peerConnection.signalingState === "have-local-offer" &&
    !peerConnection.remoteDescription
  );
}

function refreshConnectionActionState(): void {
  const scanAvailable = supportsQrScanner();
  const scanActive = activeScanStream !== null;

  createOfferBtn.disabled = deviceRole !== "master";
  createAnswerBtn.disabled = deviceRole !== "slave";
  connectBtn.disabled = !canConnectNow();

  offerInput.disabled = deviceRole !== "slave";
  answerInput.disabled = deviceRole !== "master";
  scanOfferQrBtn.disabled = deviceRole !== "slave" || !scanAvailable || scanActive;
  scanAnswerQrBtn.disabled = deviceRole !== "master" || !scanAvailable || scanActive;
  stopScanBtn.disabled = !scanActive;
}

function setDeviceRole(nextRole: DeviceRole, persist = true): void {
  deviceRole = nextRole;
  if (persist) {
    saveStoredRole(nextRole);
  }
  updateRoleUI();
  refreshConnectionActionState();
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
    peerConnection.onsignalingstatechange = null;
    peerConnection.ondatachannel = null;
    peerConnection.close();
  }
  peerConnection = null;
  signalingRole = null;

  setConnectionStatus("Disconnected");
  setChannelStatus("Closed");
  refreshControlState();
  refreshConnectionActionState();
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
    refreshConnectionActionState();
  };

  pc.onsignalingstatechange = () => {
    refreshConnectionActionState();
  };
}

function attachDataChannel(channel: RTCDataChannel): void {
  dataChannel = channel;
  setChannelStatus(channel.readyState);
  refreshControlState();

  channel.onopen = () => {
    setChannelStatus("Open");
    refreshControlState();
    refreshConnectionActionState();
    writeLog("Info", "DataChannel open.");
  };

  channel.onclose = () => {
    setChannelStatus("Closed");
    refreshControlState();
    refreshConnectionActionState();
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

function createPeerConnection(nextRole: SignalingRole): RTCPeerConnection {
  closeExistingConnection();

  signalingRole = nextRole;
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

function getBarcodeDetectorCtor(): BarcodeDetectorCtor | null {
  const extendedWindow = window as WindowWithOptionalAPIs;
  return extendedWindow.BarcodeDetector ?? null;
}

function supportsQrScanner(): boolean {
  return getBarcodeDetectorCtor() !== null && !!navigator.mediaDevices?.getUserMedia;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existingScript?.dataset.loaded === "true") {
      resolve();
      return;
    }

    const script = existingScript ?? document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => {
      reject(new Error(`Unable to load script: ${src}`));
    };

    if (!existingScript) {
      document.head.append(script);
    }
  });
}

async function ensureQrLibrary(): Promise<QRCodeLibrary | null> {
  const extendedWindow = window as WindowWithOptionalAPIs;
  if (extendedWindow.QRCode) {
    return extendedWindow.QRCode;
  }

  if (!qrLibraryPromise) {
    qrLibraryPromise = loadScript(QR_SCRIPT_URL)
      .then(() => {
        const loadedWindow = window as WindowWithOptionalAPIs;
        const library = loadedWindow.QRCode ?? null;
        if (library) {
          setQrStatus("QR generator loaded.");
        }
        return library;
      })
      .catch((error) => {
        writeLog("Error", `QR library load failed: ${asMessage(error)}`);
        setQrStatus("QR unavailable: CDN blocked/offline/CSP. Use copy/paste.");
        return null;
      });
  }

  return qrLibraryPromise;
}

function clearQrImage(target: HTMLImageElement): void {
  target.src = "";
  target.hidden = true;
}

async function renderQr(target: HTMLImageElement, value: string, label: string): Promise<void> {
  if (!value.trim()) {
    clearQrImage(target);
    return;
  }

  const qrLibrary = await ensureQrLibrary();
  if (!qrLibrary) {
    clearQrImage(target);
    setQrStatus("QR unavailable in this session (CDN blocked/offline/CSP). Use copy/paste.");
    return;
  }

  try {
    const dataUrl = await qrLibrary.toDataURL(value, {
      errorCorrectionLevel: "L",
      margin: 1,
      width: 260
    });
    target.src = dataUrl;
    target.hidden = false;
    setQrStatus("QR ready.");
  } catch (error) {
    clearQrImage(target);
    setQrStatus(`QR generation failed (${label}). Use copy/paste.`);
    writeLog("Error", asMessage(error));
  }
}

async function copyToClipboard(value: string, label: string): Promise<void> {
  if (!value.trim()) {
    writeLog("Error", `Nothing to copy for ${label}.`);
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
    writeLog("Info", `${label} copied to clipboard.`);
  } catch {
    writeLog("Error", `Clipboard unavailable. Copy ${label} manually.`);
  }
}

function stopQrScan(): void {
  if (activeScanFrame !== null) {
    cancelAnimationFrame(activeScanFrame);
    activeScanFrame = null;
  }

  if (activeScanStream) {
    activeScanStream.getTracks().forEach((track) => {
      track.stop();
    });
    activeScanStream = null;
  }

  scannerVideo.srcObject = null;
  scannerPanel.hidden = true;
  activeScanTarget = null;
  scanBusy = false;
  setScanStatus("");
  refreshConnectionActionState();
}

async function startQrScan(target: ScanTarget): Promise<void> {
  if (location.protocol !== "https:" && location.hostname !== "localhost") {
    writeLog("Error", "QR scan needs HTTPS.");
    return;
  }

  if (!supportsQrScanner()) {
    writeLog("Error", "QR scanner is not supported on this device/browser.");
    return;
  }

  stopQrScan();
  const BarcodeDetectorClass = getBarcodeDetectorCtor();
  if (!BarcodeDetectorClass) {
    writeLog("Error", "QR scanner is unavailable.");
    return;
  }

  try {
    activeScanStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } }
    });

    scannerVideo.srcObject = activeScanStream;
    scannerPanel.hidden = false;
    await scannerVideo.play();

    const detector = new BarcodeDetectorClass({ formats: ["qr_code"] });
    activeScanTarget = target;
    setScanStatus(`Scanning ${target} QR...`);
    refreshConnectionActionState();

    const scanLoop = async () => {
      if (!activeScanStream || activeScanTarget !== target) {
        return;
      }

      if (!scanBusy) {
        scanBusy = true;
        try {
          const results = await detector.detect(scannerVideo);
          const match = results.find((entry) => typeof entry.rawValue === "string" && entry.rawValue.length > 0);
          if (match?.rawValue) {
            if (target === "offer") {
              offerInput.value = match.rawValue;
              writeLog("Info", "Offer scanned from QR.");
            } else {
              answerInput.value = match.rawValue;
              writeLog("Info", "Answer scanned from QR.");
            }
            stopQrScan();
            return;
          }
        } catch {
          // ignore transient detector errors and continue scanning
        } finally {
          scanBusy = false;
        }
      }

      activeScanFrame = requestAnimationFrame(() => {
        void scanLoop();
      });
    };

    void scanLoop();
  } catch (error) {
    stopQrScan();
    writeLog("Error", `Cannot start QR scan: ${asMessage(error)}`);
  }
}

async function handleCreateOffer(): Promise<void> {
  try {
    if (deviceRole !== "master") {
      throw new Error("Role mismatch: switch to Master to create an offer.");
    }

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
    answerInput.value = "";
    clearQrImage(answerQrImage);
    await renderQr(offerQrImage, offerOutput.value, "Offer");
    writeLog("Info", "Offer created. Copy it to the other device.");
    refreshConnectionActionState();
  } catch (error) {
    setConnectionStatus("Disconnected");
    writeLog("Error", asMessage(error));
  }
}

async function handleCreateAnswer(): Promise<void> {
  try {
    if (deviceRole !== "slave") {
      throw new Error("Role mismatch: switch to Slave to create an answer.");
    }

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
    await renderQr(answerQrImage, answerOutput.value, "Answer");
    writeLog("Info", "Answer created. Copy it back to the offer device.");
    refreshConnectionActionState();
  } catch (error) {
    setConnectionStatus("Disconnected");
    writeLog("Error", asMessage(error));
  }
}

async function handleConnect(): Promise<void> {
  try {
    if (deviceRole !== "master") {
      throw new Error("Role mismatch: only Master can click Connect.");
    }

    if (!peerConnection || signalingRole !== "offerer") {
      throw new Error("Create an offer on this device before connecting.");
    }

    if (peerConnection.signalingState !== "have-local-offer") {
      throw new Error(
        `Invalid signaling state: ${peerConnection.signalingState}. Restart session and create a new offer.`
      );
    }

    const answerDescription = parseDescription(answerInput.value);
    if (answerDescription.type !== "answer") {
      throw new Error("Paste an answer JSON in 'Paste Answer'.");
    }

    await peerConnection.setRemoteDescription(answerDescription);
    writeLog("Info", "Remote answer accepted. Waiting for channel open.");
    refreshConnectionActionState();
  } catch (error) {
    writeLog("Error", asMessage(error));
  }
}

function resetSession(): void {
  closeExistingConnection();
  offerOutput.value = "";
  offerInput.value = "";
  answerOutput.value = "";
  answerInput.value = "";
  clearQrImage(offerQrImage);
  clearQrImage(answerQrImage);
  stopQrScan();
  receivedCount = 0;
  setReceivedCounter(receivedCount);
  writeLog("Info", "Session reset.");
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

resetSessionBtn.addEventListener("click", () => {
  resetSession();
});

copyOfferBtn.addEventListener("click", () => {
  void copyToClipboard(offerOutput.value, "Offer");
});

copyAnswerBtn.addEventListener("click", () => {
  void copyToClipboard(answerOutput.value, "Answer");
});

scanOfferQrBtn.addEventListener("click", () => {
  void startQrScan("offer");
});

scanAnswerQrBtn.addEventListener("click", () => {
  void startQrScan("answer");
});

stopScanBtn.addEventListener("click", () => {
  stopQrScan();
});

nextBtn.addEventListener("click", () => {
  sendCommand("NEXT");
});

prevBtn.addEventListener("click", () => {
  sendCommand("PREV");
});

roleMaster.addEventListener("change", () => {
  if (roleMaster.checked) {
    setDeviceRole("master");
  }
});

roleSlave.addEventListener("change", () => {
  if (roleSlave.checked) {
    setDeviceRole("slave");
  }
});

setConnectionStatus("Disconnected");
setChannelStatus("Closed");
setReceivedCounter(receivedCount);
clearQrImage(offerQrImage);
clearQrImage(answerQrImage);
setQrStatus("QR optional mode: loading generator...");
if (!supportsQrScanner()) {
  setScanStatus("QR scan not available on this browser/device.");
}
setDeviceRole(deviceRole, false);
refreshControlState();
refreshConnectionActionState();
void ensureQrLibrary();

window.addEventListener("beforeunload", () => {
  stopQrScan();
});
