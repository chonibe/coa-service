# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

COA Service ("Street Lamp" / "Street Collector") is a Next.js 15 + React 19 application for digital art certificate management with Supabase backend, Shopify integration, and Stripe payments. It runs on port 3000 by default.

### Running the app

- **Dev server:** `npm run dev` (starts Next.js on http://localhost:3000)
- **Lint:** `npm run lint` (runs `next lint`; exits non-zero due to existing lint backlog — this is expected)
- **Tests:** `npm test` (runs Jest; some test suites fail due to pre-existing issues — 2 of 9 suites pass)
- **Build:** `npm run build` (TypeScript and ESLint errors are ignored during builds via `next.config.js`)

### Key caveats

- **Authentication:** The app uses Google OAuth via Supabase Auth. Unauthenticated requests to `/` redirect to `/login`. Testing authenticated flows requires a Google account configured in the Supabase project.
- **Environment variables:** `.env.local` contains Supabase credentials. Many features require additional secrets (Shopify, Stripe, Mapbox, etc.) — see `.env.example` and the README for the full list.
- **Patch-package:** The `postinstall` script runs `patch-package` to apply patches in `/patches/` (currently one patch for `@splinetool/runtime`).
- **Husky pre-commit:** Runs `lint-staged` (ESLint + secret scanning) and `npm test`. If tests fail, commits may be blocked — use `--no-verify` to bypass when needed.
- **Customer portal:** A separate React (CRA) app in `/customer-portal/` with its own `package.json` and `package-lock.json`. Install its deps separately with `npm install` in that directory.
- **MCP servers:** Four MCP server sub-projects in `/mcp-servers/` — each has independent dependencies. These are optional AI development tooling and not required for the main app.
- **ESLint version:** Uses ESLint 9 with `eslint-config-next`. The flat config format is used via the Next.js wrapper.
- **Jest config:** Uses `babel-jest` with `next/babel` preset, not `ts-jest` (despite the `preset: 'ts-jest'` in config — the transform override takes precedence).
