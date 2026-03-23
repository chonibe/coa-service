# Skills hub (org-wide sync)

Self-hosted HTTP service so **any machine** (other laptops, CI nodes, teammates) can **pull** the shared skill catalog or **push** proposal bundles for review.

## Implementation

- Hub server: [`tools/skills-hub/server.mjs`](../../../tools/skills-hub/server.mjs)
- CLI (any clone of this repo): [`scripts/skills-org.mjs`](../../../scripts/skills-org.mjs)
- Canonical skill files remain in repo [`skills/`](../../../skills/README.md); the hub holds a **deployed copy** under its data directory.

## Run the hub

On a stable host (VM, office machine, Tailscale node):

```bash
export SKILLS_HUB_TOKEN='long-random-secret'
export SKILLS_HUB_HOST=0.0.0.0
export SKILLS_HUB_SEED="/absolute/path/to/coa-service-main/skills"
npm run skills:hub
```

First start seeds `data/skills` from `SKILLS_HUB_SEED` if empty. Data directory defaults to `./.skills-hub-data` (override with `SKILLS_HUB_DATA`).

Optional **`SKILLS_HUB_PUBLIC_READ=1`**: allow catalog **GET** without Bearer (publish/push still need token). Use only on trusted networks.

## API (Bearer `SKILLS_HUB_TOKEN` unless public read)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Liveness (no auth) |
| GET | `/v1/catalog.json` | Manifest + hashes |
| GET | `/v1/catalog.zip` | Full `skills/` tree as zip |
| POST | `/v1/catalog` | **Publish** — replace hub catalog from zip body |
| POST | `/v1/proposals` | **Propose** — store zip + metadata for human merge |
| GET | `/v1/proposals` | List proposals (JSON) |

## CLI from any clone

Set:

```bash
export SKILLS_HUB_URL=http://10.0.0.12:39871
export SKILLS_HUB_TOKEN=long-random-secret
```

Commands:

```bash
npm run skills:org:ping
npm run skills:org:manifest
npm run skills:org:pull      # replaces ./skills, then run npm run skills:sync
npm run skills:org:publish   # uploads local ./skills as new hub catalog (admin)
npm run skills:org:push-proposal -- --message "Team B: SEO skill tweaks"
```

## Org-wide evolution flow

1. Teams **pull** the same catalog from the hub.
2. Local work + **skill-evolver** improve `./skills/` on each machine.
3. **push-proposal** sends a zip to the hub for review (stored under `proposals/` on disk).
4. Maintainer reviews zips, merges into a branch, then **publish** from the golden repo (or copies files on the server) so everyone **pull**s the same version.

## Security

- Treat `SKILLS_HUB_TOKEN` like a shared org secret; prefer TLS termination (reverse proxy) when not on a private network.
- Do not commit real tokens; use env or a secrets manager on the hub host.

## Testing requirements

- Hub host has `zip` and `unzip` on PATH.
- After `pull`, run `npm run skills:sync` before expecting Cursor to match.

## Known limitations

- No built-in merge UI; proposals are files on disk.
- Not deployed to Vercel serverless — long-running Node process required.

## Version

- Last updated: 2026-03-23
