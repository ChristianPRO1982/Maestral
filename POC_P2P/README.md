# Maestral P2P Android POC

Minimal PWA to validate WebRTC DataChannel communication between two Android devices on local Wi-Fi.

## Scope

- Manual signaling only (copy/paste SDP JSON)
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

1. Device A: click `Create Offer`, copy `Offer SDP`.
2. Device B: paste into `Paste Offer`, click `Create Answer`, copy `Answer SDP`.
3. Device A: paste into `Paste Answer`, click `Connect`.
4. Wait for `Connection status: Connected` and `DataChannel status: Open`.
5. Use `NEXT` / `PREV` on either device and confirm live logs.

## PWA Install / Offline Test

1. Host on HTTPS (Netlify / GitHub Pages / Cloudflare Pages).
2. Install on both Android devices from Chrome.
3. Launch once online to fill cache.
4. Disable Internet, keep same local Wi-Fi.
5. Relaunch app and verify signaling + commands still work.
