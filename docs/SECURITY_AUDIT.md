# Security Audit Report — Phase 9

Conducted as a full-codebase review before recruitment submission. Scope:
authentication, authorization, input validation, WebSockets, database,
general security posture, and frontend state/socket handling.

## Summary

| # | Issue | Severity | Status | File |
|---|---|---|---|---|
| 1 | No rate limiting on `/auth/login` (brute-force risk) | Medium | **Fixed** | `src/middleware/rateLimit.ts`, `src/routes/auth.ts` |
| 2 | Dev-toolchain vulnerabilities (`vitest`/`vite`/`esbuild`) | Low (dev-only) | **Accepted, documented** | `package.json` (devDependencies) |
| 3 | JWTs aren't server-side revocable on logout | Low | **Accepted, documented** | `src/utils/jwt.ts` |
| 4 | Static-string CORS origin — initial appearance of a bug | N/A | **Reviewed, confirmed correct** | `src/app.ts` |
| 5 | User-enumeration via login error message | — | **Not present — verified** | `src/services/authService.ts` |
| 6 | SQL injection via string-built queries | — | **Not present — verified** | `src/repositories/*.ts` |
| 7 | Password hash / JWT secret exposure in responses or logs | — | **Not present — verified** | `src/services/authService.ts`, `src/middleware/errorHandler.ts` |
| 8 | Stack traces / internal errors leaked to clients | — | **Not present — verified** | `src/middleware/errorHandler.ts` |
| 9 | Client-supplied role/header can escalate privilege | — | **Not present — verified with dedicated tests** | `src/middleware/auth.ts` |
| 10 | Unauthenticated Socket.IO connections accepted | — | **Not present — verified** | `src/realtime/socket.ts` |
| 11 | Secrets committed to git | — | **Not present — verified** | `.gitignore`, `git ls-files` |

---

### 1. No rate limiting on `/auth/login` — Medium — Fixed

**Issue:** the login endpoint had no request throttling, so an attacker
could attempt unlimited password guesses against a known email.

**Fix:** added `express-rate-limit` (20 requests / 15 min / IP) ahead of
validation on `POST /auth/login`, returning `429` with a
`RATE_LIMITED` code once exceeded.

**Files:** `src/middleware/rateLimit.ts` (new), `src/routes/auth.ts`.

**Verification:**
```bash
for i in $(seq 1 22); do
  curl -s -o /dev/null -w "%{http_code} " -X POST http://localhost:4000/auth/login \
    -H "Content-Type: application/json" -d '{"email":"nobody@x.dev","password":"wrong"}'
done
```
Confirmed live: requests 1–20 return `401`, requests 21–22 return `429`.
Also covered by an automated test asserting `RateLimit-*` response
headers are present (`src/__tests__/auth.test.ts`).

---

### 2. Dev-toolchain vulnerabilities — Low (dev-only) — Accepted

`npm audit` reports 5 findings (1 critical, 1 high, 3 moderate), all
inside the `vitest → vite → esbuild` dev/test dependency chain — **zero
findings in any production dependency** (`express`, `socket.io`, `pg`,
`jsonwebtoken`, `bcrypt`, `zod`, `next`, `react`, etc. are all clean).

The specific advisory (esbuild's dev server accepting cross-origin
requests) only affects a developer's own machine while running the
Vite/Vitest dev server locally — it has no bearing on the deployed
application, which doesn't run esbuild's dev server at all.

**Why not fixed:** the available fix (`npm audit fix --force`) bumps
`vitest` across a major version (2.x → 4.x), which is a breaking
change. Forcing it without validating the whole test suite against the
new API risks trading a low-impact, dev-only advisory for real test
breakage right before submission. Recommended as a follow-up in a
dedicated commit with its own verification pass, not bundled into the
audit.

**Verification:** `npm audit` from repo root; inspect that all listed
packages resolve under `vitest`/`vite`/`esbuild` in `devDependencies`.

---

### 3. JWTs aren't server-side revocable on logout — Low — Accepted

**Issue:** logout only clears the token client-side (Zustand store +
localStorage). The JWT itself remains cryptographically valid until it
expires — a stolen token can't be invalidated early.

**Why accepted:** this is the standard tradeoff of stateless JWT auth.
A revocation list would require server-side session state (defeating
the point of stateless tokens) or a refresh-token rotation scheme —
meaningfully more architecture for a recruitment-scoped project. The
mitigation already in place is a short expiry (`JWT_EXPIRES_IN=1h`),
which bounds the exposure window.

**File:** `src/utils/jwt.ts`, `apps/web/src/stores/authStore.ts`.

---

### 4. Static-string CORS origin — Reviewed, confirmed correct

Initial read of `cors({ origin: env.corsOrigin })` looked suspicious:
manually testing with `Origin: http://evil.example.com` still returns
`Access-Control-Allow-Origin: http://localhost:3000` in the response.

That's expected `cors` package behavior for a fixed-string origin (as
opposed to a validator function) — the header value doesn't depend on
the request's `Origin`. It's not a vulnerability: CORS is enforced by
the *browser*, which compares the `Access-Control-Allow-Origin` value
against its *own* origin, not the server's. A page running on
`evil.example.com` receiving `ACAO: http://localhost:3000` still gets
blocked by the browser, because the header doesn't match the page's
actual origin. Confirmed with curl (server-side) — the real
enforcement point (browser JS `fetch`) would reject this response.

**File:** `src/app.ts`. **Verification:** curl with a spoofed `Origin`
header (see command above) plus standard browser CORS semantics.

---

### 5–11. Verified clean

| # | What was checked | Result |
|---|---|---|
| 5 | `/auth/login` error message for unknown-email vs wrong-password | Identical `401` + `INVALID_CREDENTIALS` for both — see `authService.login`, and a dummy-hash `bcrypt.compare` runs even when no user is found, so timing doesn't disclose which case it was |
| 6 | Every `pool.query()` call across `src/repositories/` | 100% parameterized (`$1, $2, …`), zero string-concatenated SQL — confirmed via `grep` |
| 7 | Login/`/auth/me` responses, error handler, console logs | `PublicUser` type has no password/hash field; `AppError`-based responses never include internals |
| 8 | Non-`AppError` exceptions | Logged server-side only (`console.error`); client always gets the generic `"Internal server error"` |
| 9 | `requireRole` middleware + a viewer sending `X-Role: ENGINEER` header and `{"role":"ENGINEER"}` body | Still `403` — role is read exclusively from the verified JWT payload set in `authenticate`, nothing else on the request is ever consulted |
| 10 | Socket.IO `io.use()` handshake middleware | Connections with no token or an invalid token are rejected before `connection` fires — verified with an automated test and a manual client |
| 11 | `git ls-files` for `.env`/`.env.local` | None tracked; `.gitignore` excludes them at both root and `apps/web` level |

## Test coverage

24 backend tests (`npm run test`), covering:

- Health (`GET /health`)
- Login: success, wrong password, unknown email, malformed input, rate-limit headers
- Protected routes: no token, garbage token, valid token, tampered role header/body
- Telemetry: unauthenticated, viewer forbidden, engineer allowed, out-of-range value rejected, valid override respected, tampered role rejected
- Socket.IO: no token rejected, invalid token rejected, valid token receives history

## Commands run

```
npm run typecheck   # pass
npm run lint         # pass
npm run test          # 24/24 pass
npm run build          # pass (shared -> server -> web)
```
