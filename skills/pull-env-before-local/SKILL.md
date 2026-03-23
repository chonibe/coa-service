---
name: pull-env-before-local
description: Ensures environment variables are pulled from Vercel before running the app locally. Use when the user wants to run the dev server, start local development, run npm run dev, or when env vars are missing or stale. Also apply when debugging "env not set" errors or before testing locally.
---

# Pull Env Before Local Development

## Critical Rule

**ALWAYS run `vercel env pull` before starting the local dev server.**

This project uses Vercel for deployment. Environment variables (Supabase, Shopify, etc.) live in Vercel—they are not checked into git. Running locally without pulling env vars causes missing-var errors and broken features.

## Workflow

When starting local development or when the user asks to run the app locally:

1. **Pull env vars first:**
   ```bash
   vercel env pull
   ```
   This writes `.env.local` from Vercel. Use `vercel env pull .env.local` if you need to specify the output file.

2. **Then start the dev server:**
   ```bash
   npm run dev
   ```

## When to Apply

- User says "run locally", "start dev", "run the app", "npm run dev"
- User reports missing env vars, API errors, or Supabase/Shopify connection failures
- Before running any script or dev server that needs env vars
- After cloning the repo or switching branches (env may be stale)

## Quick Check

If `.env.local` is missing or the user reports env issues, run:

```bash
vercel env pull
```

Then retry the dev server or command.
