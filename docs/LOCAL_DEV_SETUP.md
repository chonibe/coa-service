# Local Development Setup

This guide covers everything needed to run and develop the COA Service locally.

## Prerequisites Checklist

- [ ] **Node.js 16+** — [Download](https://nodejs.org/) or use `nvm install 18`
- [ ] **npm** — Included with Node.js (`npm -v` to verify)
- [ ] **Git** — Repo is connected to `https://github.com/chonibe/coa-service`
- [ ] **Supabase account** — [supabase.com](https://supabase.com)
- [ ] **Vercel account** (optional for deploy) — [vercel.com](https://vercel.com)

## 1. Install Dependencies

```bash
cd /path/to/coa-service-main
npm install
```

This installs all app dependencies **and** the Vercel CLI and Supabase CLI (as devDependencies), so you can run:

- **Vercel:** `npx vercel` or `npm exec vercel`
- **Supabase:** `npx supabase` or `npm exec supabase`

To install the CLIs globally instead (optional):

```bash
npm install -g vercel supabase
```

Then use `vercel` and `supabase` directly.

## 2. Environment Variables

Create `.env.local` in the project root (see [README.md](../README.md) Environment Variables section for full list).

**Minimum to run the app:**

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |

**For auth and full features:** add `SUPABASE_GOOGLE_CLIENT_ID`, `SUPABASE_GOOGLE_CLIENT_SECRET`, `VENDOR_SESSION_SECRET`, `ADMIN_SESSION_SECRET`, and Shopify/Stripe credentials as needed.

Copy from `.env.example` and fill in values:

```bash
cp .env.example .env.local
# Edit .env.local with your Supabase and other credentials
```

## 3. Supabase CLI (optional for local DB)

If you use a **hosted Supabase project** (recommended for most devs), you only need the env vars above.

To link the project and run migrations:

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
# Or use the project script: npm run supabase:link
npx supabase db push   # when you have new migrations
```

Project ref is in your Supabase dashboard URL: `https://supabase.com/dashboard/project/<project-ref>`.

For **local Supabase** (Docker required):

```bash
npx supabase start
```

## 4. Vercel CLI (optional for deploy/preview)

Login and link for deployments:

```bash
npx vercel login
npx vercel link    # link to existing Vercel project
npx vercel dev     # run with Vercel dev server (optional)
```

Deploy to production:

```bash
npx vercel --prod
```

## 5. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quick Reference

| Task | Command |
|------|--------|
| Install deps + CLIs | `npm install` |
| Run dev server | `npm run dev` |
| Vercel CLI | `npx vercel` |
| Supabase CLI | `npx supabase` |
| Supabase link | `npm run supabase:link` |
| Build | `npm run build` |
| Start production | `npm run start` |

## Troubleshooting

- **`node: command not found`** — Install Node.js 16+ and ensure it’s on your `PATH`.
- **Supabase connection errors** — Check `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.
- **Vercel not found** — Run `npm install` so `npx vercel` uses the local devDependency.

## Version

- Last updated: 2025-02-12
- Supabase CLI: in `package.json` devDependencies
- Vercel CLI: in `package.json` devDependencies
