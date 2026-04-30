# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

COA Service (Street Collector) is a Next.js 15 (App Router) platform for digital art authentication, collection management, and ecommerce. The core stack is TypeScript, React 19, Supabase (hosted Postgres + Auth), Shopify APIs, and Stripe. See `README.md` for the full feature list.

### Running the app

- **Dev server:** `npm run dev` (port 3000)
- **Environment variables** live in Vercel. Pull them with `vercel env pull .env.local` (requires `VERCEL_TOKEN` or `vercel login`). Without real credentials the app starts and most pages render, but Shopify-backed shop pages and external API calls will error.
- A `.env.example` exists at the repo root with all variable names and inline docs.

### Lint / Test / Build

| Command | Notes |
|---------|-------|
| `npm run lint` | ESLint; exits non-zero due to ~400 warnings (CI uses `continue-on-error`) |
| `npm test` | Jest; 28 suites / 147 tests |
| `npm run build` | Next.js production build; ESLint and TS errors are ignored via `next.config.js` |

### Gotchas

- **`patch-package`** runs in `postinstall` to patch `@splinetool/runtime`. If it fails it is non-fatal (prints a warning and continues).
- **Husky + lint-staged** runs on pre-commit: `eslint --fix` and `scripts/scan-secrets.js`. If Husky setup fails during `npm install`, it is also non-fatal.
- **No local Supabase needed** — the app connects to the hosted Supabase project (`ldmppmnpgdxueebkkpid`). Migrations live in `supabase/migrations/` and can be applied with the Supabase CLI when linked (`npm run supabase:link`).
- The `.cursor/environment.json` only sets `agentCanUpdateSnapshot: true`; there is no Dockerfile or build config referenced.
