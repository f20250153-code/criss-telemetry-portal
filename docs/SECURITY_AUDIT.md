# Security Audit

A review pass over the whole codebase before submitting — auth, authorization, input validation, WebSockets, the database layer, and general hygiene (secrets, error handling, CORS).

## Summary

| Issue | Severity | Status |
|---|---|---|
| No rate limiting on `/auth/login` | Medium | Fixed |
| `npm audit` findings in the dev toolchain | Low, dev-only | Left as-is, explained below |
| JWTs can't be revoked server-side on logout | Low | Accepted tradeoff |
| CORS origin looked suspicious at first glance | — | Checked, it's fine |
| Everything else below | — | Checked, nothing found |

### Login had no rate limiting

Anyone could throw unlimited password guesses at `/auth/login` for a known email. Added `express-rate-limit` — 20 requests per 15 minutes per IP, returns `429` once you're over the limit.

Tested it directly:
```bash
for i in $(seq 1 22); do
  curl -s -o /dev/null -w "%{http_code} " -X POST http://localhost:4000/auth/login \
    -H "Content-Type: application/json" -d '{"email":"nobody@x.dev","password":"wrong"}'
done
```
Requests 1–20 came back `401`, 21 and 22 came back `429`. There's also a test asserting the rate-limit headers are present on every login response.

### `npm audit` isn't clean, but it's not a real problem

Five findings show up, all inside `vitest → vite → esbuild` — the test runner's own dependency chain, not anything that ships in the app. `express`, `socket.io`, `pg`, `jsonwebtoken`, `bcrypt`, `zod`, `next`, `react` — all clean.

The specific advisory is about esbuild's dev server accepting cross-origin requests, which only matters while you're running the Vite/Vitest dev server on your own machine — it has nothing to do with the deployed app, which never runs that dev server at all. The fix would mean bumping Vitest across a major version right before submission without time to properly re-validate the whole suite against it, so I left it as a known, low-priority item instead of risking breaking the tests.

### Logout doesn't revoke the token server-side

If someone's JWT leaks, it's still valid until it naturally expires — logout only clears it client-side. This is just how stateless JWTs work; actually revoking them would mean adding server-side session state, which defeats a lot of the point of using JWTs in the first place. The token expiry is set to 1 hour, which keeps the exposure window small. A proper fix (refresh tokens + a revocation list) felt like more infrastructure than this project needed.

### The CORS config looked wrong until I actually checked it

Testing with `curl -H "Origin: http://evil.example.com"` still returned `Access-Control-Allow-Origin: http://localhost:3000` in the response, which looked like a bug at first. It isn't — that's normal behavior for the `cors` package when you give it a fixed string instead of a validator function. CORS enforcement happens in the *browser*, not the server: the browser compares that header against its own page's origin, not against whatever the server thinks the origin is. A page on `evil.example.com` getting back `ACAO: http://localhost:3000` still gets blocked by the browser, because the two don't match. So it's actually working correctly, it just looked odd from the server side.

### Everything else I checked and didn't find problems with

- **Login doesn't leak which part was wrong.** Wrong password and unknown email both return the identical 401 + `INVALID_CREDENTIALS`. There's even a dummy bcrypt comparison that runs when no user is found, so the response timing doesn't give it away either.
- **No SQL injection anywhere.** Every query in `src/repositories/` is parameterized (`$1`, `$2`, ...) — no string concatenation, confirmed by grepping the whole directory.
- **Password hashes and JWT secrets never show up in responses or logs.** The `PublicUser` type doesn't even have a field for them.
- **Unexpected errors don't leak internals.** Anything that isn't a deliberately-thrown `AppError` gets logged server-side only; the client always just sees "Internal server error."
- **Role can't be spoofed.** Sent a viewer's token with an `X-Role: ENGINEER` header and `{"role":"ENGINEER"}` in the body — still 403. The role is only ever read from the verified JWT payload, nothing else on the request gets consulted.
- **Sockets need a real token.** No token or a garbage one gets rejected before the connection ever completes — checked with both an automated test and a manual client.
- **No secrets in git.** No `.env` files tracked anywhere in the repo.

## Test coverage

24 backend tests, covering health checks, login (success, wrong password, unknown email, bad input, rate limiting), protected routes (no token, garbage token, valid token, tampered role), telemetry (permissions, validation, overrides), and the socket handshake.

## Commands run

```
npm run typecheck   # pass
npm run lint         # pass
npm run test          # 24/24 pass
npm run build          # pass
```
