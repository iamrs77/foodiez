# 3. Logins with signed tokens (JWT)

- **Status:** Accepted
- **Date:** 2026-10-12

## Context

The API needs to know who is calling. The 2021 version already used JWTs. The two common choices are a signed token the client sends with each request, or a session stored on the server and referenced by a cookie.

## Decision

Keep JWTs. Logging in returns a token signed with `JWT_SECRET` that expires after a day (`JWT_EXPIRES_IN`), holding the user's id and role. The web app stores it in `localStorage` and sends it as `Authorization: Bearer <token>`.

Two things make it safer than a bare JWT:

- **The user is loaded on every request.** `requireAuth` checks the signature and expiry, then loads the account. A deleted account stops working at once, and a demo account stops when its demo ends, even though their tokens are still valid.
- **A `401` logs the web app out**, so an expired session never leaves the app half logged in.

Login is rate-limited (20 tries per 15 minutes per IP), and a wrong email and a wrong password take the same time and give the same error.

Turned down: **server-side sessions with an HTTP-only cookie** (what Stockroom uses). They can be revoked instantly and keep the token away from JavaScript. They'd need a sessions collection and cookie handling, plus CSRF protection for a cookie-authenticated API. For this app, a short-lived token with the account checked on every request was enough.

## Consequences

- **A token can't be revoked early**: logging out only forgets it in the browser. A stolen token works until it expires, up to a day, unless the account is deleted.
- **JavaScript can read the token**, so a cross-site scripting bug could leak it. React escapes what it renders, and Helmet's content security policy only allows the app's own scripts, which narrows that risk but doesn't remove it.
- **Every request costs one database read** for the user. That's cheap at this size and is what makes deletes and demo expiry take effect at once.
- No cookies means no CSRF exposure, and the API works the same for any client that can send a header.
