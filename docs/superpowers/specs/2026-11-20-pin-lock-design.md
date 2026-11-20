# PIN lock for Rise — design (short)

Date: 2026-11-20 · Status: approved in chat

## Why
Rise is public at `https://rise.ajamlab.my`. Cloudflare Access (email OTP) felt like a hassle, and its
OTP emails did not arrive. The owner wants a lock screen built into Rise that looks like Rise.
Only the owner uses Rise. Other people must see nothing, and the owner's own devices should stay open.

## Goals
- A frosted lock screen. The Rise pastel blobs show through blurred glass, with the centred text
  "Enter PIN to see progress, tepungPelita" and 6 digit boxes.
- An unlock animation that "opens" into the dashboard.
- A "Remember this device" checkbox, ticked by default. When ticked, the browser stays unlocked until
  the owner locks it. When unticked, the unlock ends when the browser closes.
- Once unlocked, a **lock switch** (toggle) in the header, and in the More sheet on phones. Flipping it
  locks this browser and plays a closing animation.
- After 3 wrong PINs the PIN form locks for 15 minutes. Further misses lengthen the lock to 1 hour,
  then 24 hours. A correct PIN resets the count.
- When the PIN lock is live and verified, Cloudflare Access is removed.

## Non-goals / anti-goals
- No accounts and no multiple users.
- **Anti-goal:** a lock that is only visual. Locking must happen on the server: every page, form action
  and API is refused without a valid unlock cookie. The page must not render any task data, and that
  includes the inbox count in the layout.
- The PIN and the secret are never in the repo, because the repo is public.

## Approaches
1. **Server-checked PIN plus a signed cookie (picked).** The PIN is checked in `hooks.server.ts`, and
   unlocking sets an HMAC-signed httpOnly cookie. This gives the custom look and is real protection.
2. A client-side overlay only. Rejected: anyone can bypass it with dev tools.
3. Keep Cloudflare Access with Google login. Rejected: the login screen belongs to Cloudflare, so the
   custom screen and animation are not possible.

## Decided
- 6-digit PIN. The server stores only an scrypt hash, in `RISE_PIN_HASH` in `~/rise/.env`. The cookie
  signing key is `RISE_SECRET`, in the same file. Changing the PIN rotates the secret, which locks
  every device.
- The lockout counter is global, not per IP, because attackers can rotate IPs. Devices that already
  hold a valid cookie are not affected by the lockout.
- `/api/health` stays open (Docker healthcheck, no data). Static assets stay open too: `/_app/*`,
  icons, the manifest and favicon.
- If production has no `RISE_PIN_HASH`, it fails closed (lock screen says "PIN not set up"). In dev,
  with no hash, the lock is off.

## Builder's calls
- The lockout state lives in memory and resets when the container restarts. Restarts only happen on
  the owner's deploys, so this is acceptable.
- The cookie `rise_unlock` is `v1.<issuedAt>.<hmac>`, SameSite=Lax, Secure on https. A remembered
  device gets a max age of 400 days, which is the browser cap. A non-remembered one gets a session
  cookie.
- The PIN is set with `scripts/set-pin.mjs`. It asks for the PIN with hidden input and prints the two
  env lines, which go into `~/rise/.env` over SSH. The PIN never appears in chat or in logs.
- `gate/compose.yml` and the local `docker-compose.yml` pass `RISE_PIN_HASH` and `RISE_SECRET`
  into the container.
