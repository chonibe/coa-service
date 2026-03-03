# Test Suite Optimization Report

**Generated:** 2026-03-03  
**Related:** [jest.config.js](../jest.config.js)

## Executive Summary

The Jest test suite currently has **7 failing suites** and **17 failing tests**. Several fixes were applied; remaining issues require Jest config changes and better mocks for Next.js/Supabase.

---

## Test Results Summary

| Status | Suites | Tests |
|--------|--------|-------|
| Pass  | 3      | 20    |
| Fail  | 6      | 17    |

**Passing:**
- `lib/middleware/cors.test.ts`
- `lib/middleware/rate-limit.test.ts`
- `tests/vendor-session.test.ts`

---

## Fixes Applied

### 1. [`app/shop/home/page.tsx`](../app/shop/home/page.tsx) — Nullish coalescing syntax
**Issue:** `edge?.node?.altText || featuredProduct?.title ?? ''` — mixing `||` and `??` without parens caused Babel parse error during coverage.

**Fix:** `(edge?.node?.altText || featuredProduct?.title) ?? ''`

### 2. [`lib/middleware/cors.ts`](../lib/middleware/cors.ts) — Export CORS helpers
**Issue:** `getAllowedOrigins` and `isOriginAllowed` were not exported; tests import them as named exports.

**Fix:** Added `export` to both functions.

---

## Failing Tests & Root Causes

### 1. `tests/security/xss.test.ts` — ESM/transform issue
- **Error:** `SyntaxError: Unexpected token 'export'` in `node_modules/@exodus/bytes/encoding-lite.js`
- **Cause:** jsdom depends on ESM packages; Jest ignores `node_modules` by default.
- **Fix:**
  - Add `transformIgnorePatterns` exception for `@exodus/bytes` and related jsdom deps, or
  - Mock `jsdom` in the test: `jest.mock('jsdom', () => ({ JSDOM: jest.fn() }))` and test DOMPurify only.

### 2. `tests/security/ratelimit.test.ts` & `tests/security/headers.test.ts` — NextRequest in Jest
- **Error:** `Cannot set property url of #<NextRequest> which has only a getter`
- **Cause:** `whatwg-fetch` / Node Request polyfill conflicts with Next.js `NextRequest`.
- **Fix:**
  - Use `Request` from `undici` or Node 18+ native `fetch` instead of `whatwg-fetch`, or
  - Mock `NextRequest` with a simple object that mimics `url` and `headers`.

### 3. `tests/rbac.test.ts` — Response.json & Supabase mocks
- **Error 1:** `Response.json is not a function` — Next.js `NextResponse.json` not properly mocked.
- **Error 2:** `Cannot destructure property 'data' of ... as it is undefined` — Supabase client mock missing `.from().select().eq()` chain.
- **Fix:**
  - Ensure `jest.setup.js` mocks `next/server` correctly.
  - Extend Supabase mock to return `{ data, error }` from `.select().eq().single()`.

### 4. `tests/vendor-auth.test.ts` — Supabase mock chain
- **Error:** `client.from(...).update(...).eq is not a function`
- **Cause:** Mock returns a plain object; Supabase client uses chained methods returning new instances.
- **Fix:** Use a chainable mock:
  ```js
  from: () => ({
    update: () => ({
      eq: () => Promise.resolve({ data: null, error: null })
    })
  })
  ```

### 5. `tests/auth.test.ts` — GraphQL auth during import
- **Error:** `GraphQLError: Not authenticated` thrown during module load.
- **Cause:** GraphQL resolvers or auth checks run at import time.
- **Fix:** Lazy-load or gate auth logic so it doesn’t run on import; mock `lib/graphql/auth` before importing tests.

---

## Coverage Optimization

- **Current thresholds:** 10% (statements, branches, lines, functions)
- **Actual:** ~0.3% across app/lib due to many failing/importing suites
- **Recommendation:** Run coverage only when needed: `npm run test:coverage` instead of `collectCoverage: true` in default `npm test`.

### Jest config adjustment

```js
// jest.config.js - consider:
collectCoverage: process.env.CI === 'true' || process.argv.includes('--coverage'),
```

---

## Checklist for Full Test Health

- [ ] [xss.test.ts](../tests/security/xss.test.ts) — Fix jsdom/ESM via transformIgnorePatterns or mock
- [ ] [ratelimit.test.ts](../tests/security/ratelimit.test.ts) — Replace NextRequest or add mock
- [ ] [headers.test.ts](../tests/security/headers.test.ts) — Same NextRequest fix
- [ ] [rbac.test.ts](../tests/rbac.test.ts) — Mock NextResponse.json and Supabase chain
- [ ] [vendor-auth.test.ts](../tests/vendor-auth.test.ts) — Chainable Supabase mock
- [ ] [auth.test.ts](../tests/auth.test.ts) — Mock GraphQL auth to avoid import-time errors
- [ ] [jest.config.js](../jest.config.js) — Make coverage opt-in for faster default runs

---

## Performance Notes

- **Time:** ~24s for full suite
- **Suggestions:**
  - Run only changed tests: `npm run test:watch` during dev
  - Use `--testPathPattern` for focused runs: `jest vendor`
  - Exclude heavy/integration tests from default run via `testPathIgnorePatterns` if appropriate
