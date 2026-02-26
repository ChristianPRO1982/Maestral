# Maestral P2P Android POC

Minimal PWA to validate WebRTC DataChannel communication between two Android devices on local Wi-Fi.

## Scope

- Manual signaling only (copy/paste SDP JSON)
- Optional QR workflow (generate + scan), with copy/paste fallback
- Fixed device role per install (`Master` / `Slave`) stored locally
- Commands: `NEXT`, `PREV`
- Status labels + message log + received counter
- Offline startup through service worker cache
- No backend, no database, no PDF

## Run

```bash
cd POC_P2P
npm install
npm run dev
```

Build:

```bash
npm run build
npm run preview
```

## Manual Connection Flow

1. Set roles once:
   - Tablet A: `Master`
   - Tablet B: `Slave`
2. Master: click `Create Offer`, copy `Offer SDP`.
3. Slave: paste into `Paste Offer`, click `Create Answer`, copy `Answer SDP`.
4. Master: paste into `Paste Answer`, click `Connect`.
5. Wait for `Connection status: Connected` and `DataChannel status: Open`.
6. Use `NEXT` / `PREV` on either device and confirm live logs.

## QR Connection Flow (optional)

1. Master: `Create Offer`.
2. Slave: click `Scan Offer QR` (or paste text manually), then `Create Answer`.
3. Master: click `Scan Answer QR` (or paste text manually), then `Connect`.

Notes:
- Role choice is persisted in local storage.
- SDP must still be exchanged for each new WebRTC session.
- If QR is unavailable on a device/browser, use copy/paste text flow.

## PWA Install / Offline Test

1. Host on HTTPS (Netlify / GitHub Pages / Cloudflare Pages).
2. Install on both Android devices from Chrome.
3. Launch once online to fill cache.
4. Disable Internet, keep same local Wi-Fi.
5. Relaunch app and verify signaling + commands still work.
