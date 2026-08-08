# 0008. The Next server holds the tokens, not the browser

- **Status**: accepted
- **Date**: 2026-08-08

## Context

The API issues a short-lived JWT access token and a long-lived refresh token.
The frontend and the API are separate origins (`:3001` and `:3000` in
development, different hostnames in production). Something has to decide where
those tokens live between requests.

The usual options:

1. **`localStorage`.** Any XSS reads both tokens and exfiltrates them. A single
   compromised dependency is a full account takeover with no expiry.
2. **The API sets its own cookies.** Cross-origin, so they need
   `SameSite=None; Secure` — which puts them on _every_ cross-site request the
   browser can be tricked into making, and hands us CSRF to solve from scratch,
   plus a credentialed CORS allow-list that must never regress to `*`.
3. **The Next server holds them.** The API returns tokens in a JSON body; Route
   Handlers on the frontend origin re-house them as httpOnly cookies.

## Decision

Option 3. `src/app/api/auth/*` are the only modules that ever see a raw token.

- `sv_at` (access) — httpOnly, `SameSite=Lax`, `Secure` in production, `path=/`.
- `sv_rt` (refresh) — same flags, but **`path=/api/auth`**, so the browser will
  not attach it to page loads or ordinary API calls. A forced-request attack is
  therefore capped at the access token's lifetime, not the refresh token's.
- Browser-side API calls go through `src/app/api/proxy/[...path]`, which attaches
  the bearer token server-side. `connect-src` in the CSP is consequently `'self'`
  — an injected script has no permitted off-origin destination.
- Non-GET handlers verify `Origin` against `NEXT_PUBLIC_APP_URL`, on top of
  `SameSite=Lax`.
- `shared/auth/session.ts` refreshes an expired access token transparently and
  is wrapped in React `cache`, so parallel RSC fetches perform one rotation.
  Without that, the second concurrent request would present an already-rotated
  token, which the API correctly reads as a leak — and answers by revoking every
  session the user has.

On the API side, refresh tokens are stored as SHA-256 hashes with rotation and
reuse detection: redeeming a token that was already redeemed revokes every
session for that user and bumps `users.token_version`, which invalidates
outstanding access tokens too.

## Consequences

- Tokens are unreachable from JavaScript. XSS can still _act as_ the user while
  the page is open, but it cannot steal a credential and use it later or
  elsewhere. That is the meaningful reduction.
- Every browser-side API call takes an extra hop through our server. On the same
  host this is cheap, but it is a real dependency: if the Next server is down,
  the client cannot reach the API even though the API is up.
- The proxy has to be careful about what it forwards. It strips `authorization`
  and `cookie` on the way out (so the caller cannot supply their own token, and
  session cookies never reach the API) and `set-cookie` on the way back (so the
  API cannot overwrite cookies the BFF owns).
- Tokens in a JSON body appear in the API's response payloads, so they must never
  be logged there. The backend's response logging is header-and-status only.
- A second, non-browser client (a mobile app) would talk to the API directly with
  bearer tokens. That path is unaffected by any of this — the BFF is a browser
  concern, not an API redesign.
