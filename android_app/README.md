# Maestral Android MVP - Device Connection

This folder now contains a minimal Android app scaffold (Kotlin + Compose) focused on one target:

- validate connection between two devices on local network

## MVP Scope Implemented

- Single screen with two roles:
  - `Host` (starts local TCP server)
  - `Join` (connects to host by IP + port + token)
- Simple handshake with token:
  - joiner sends `HELLO <token>`
  - host answers `OK` or rejects
- Connection status + event log UI
- Ping/message exchange for end-to-end validation

Note:
- This MVP uses local TCP sockets as a fast validation path.
- Final V2 transport target in spec remains Nearby Connections.

## Test Setup: Pixel 7 + Ubuntu Dev PC

Recommended pair for first test:

1. Pixel 7 runs `Host`
2. Android Emulator on Ubuntu runs `Join`

Why:
- Emulator IP is usually NATed/non-routable from phone.
- Phone Wi-Fi IP is typically reachable from emulator.

## Run Steps

1. Open `android_app` in Android Studio.
2. Let Gradle sync and install suggested SDK/build tools.
3. Launch app on Pixel 7 and on Android Emulator.
4. On Pixel:
   - choose `Host`
   - keep default port (`8989`) or choose another
   - note displayed local IP + token
   - tap `Start Hosting`
5. On Emulator:
   - choose `Join`
   - set host IP/token/port from Pixel
   - tap `Connect`
6. Verify:
   - both sides show `Connected`
   - `Send Ping` works
   - message exchange appears in logs

## Troubleshooting

- Ensure phone and PC are on the same LAN/hotspot.
- If connect fails, disable/review Ubuntu firewall rules for chosen port.
- If phone cannot reach emulator host mode, invert roles (phone host, emulator join).
