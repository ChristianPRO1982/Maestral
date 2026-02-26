# Core Smoke Cases (Pre-Implementation Reference)

Source: `docs/PRODUCT_SPEC_V2.md`

## 1. Solo Mode

- [ ] Single device: page-by-page navigation works
- [ ] Dual device: page change on one side appears on the other
- [ ] Last-page complement shows neutral empty screen

## 2. Choir Mode

- [ ] Master can start/end session
- [ ] Follower joins via token/QR
- [ ] Follow mode mirrors Master page
- [ ] Free mode ignores Master page turns
- [ ] Song change from Master overrides follower local context

## 3. Resilience

- [ ] Temporary disconnect keeps UI usable
- [ ] Reconnection restores correct state
- [ ] Rapid page changes converge on latest state

## 4. UX

- [ ] Connected/Disconnected indicator visible where relevant
- [ ] Follow/Free status visible for followers
- [ ] No blocking UI during reconnect attempts
