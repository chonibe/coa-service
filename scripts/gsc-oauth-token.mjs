#!/usr/bin/env node
/**
 * One-time OAuth2 for Google Search Console API (read-only).
 *
 * Prereqs:
 * 1. Google Cloud: enable "Google Search Console API" for the project.
 * 2. OAuth client (Web): add Authorized redirect URI:
 *    http://127.0.0.1:3333/oauth2callback
 *    (The JSON you download may only list the production site; the loopback URI is required for this CLI.)
 * 3. Env: GSC_OAUTH_CLIENT_SECRETS_PATH=/absolute/path/to/client_secret_....json
 *
 * Usage (from repo root, with .env.local or env):
 *   GSC_OAUTH_CLIENT_SECRETS_PATH=... node scripts/gsc-oauth-token.mjs
 *
 * Save the printed refresh token as GSC_OAUTH_REFRESH_TOKEN, then run gsc-search-analytics.mjs
 */
import fs from "fs";
import http from "http";
import { fileURLToPath } from "url";
import path from "path";
import { google } from "googleapis";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(REPO_ROOT, ".env.local") });
dotenv.config();

const PORT = Number(process.env.GSC_OAUTH_PORT || 3333);
const REDIRECT = `http://127.0.0.1:${PORT}/oauth2callback`;
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

const secretsPath = process.env.GSC_OAUTH_CLIENT_SECRETS_PATH;
if (!secretsPath || !fs.existsSync(secretsPath)) {
  console.error(
    "Set GSC_OAUTH_CLIENT_SECRETS_PATH to the full path of your client_secret_....json (from Google Cloud)."
  );
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(secretsPath, "utf8"));
const web = raw.web || raw.installed;
if (!web?.client_id || !web?.client_secret) {
  console.error("Invalid client secret file: expected web.client_id and web.client_secret");
  process.exit(1);
}

const oAuth2Client = new google.auth.OAuth2(
  web.client_id,
  web.client_secret,
  REDIRECT
);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: "offline",
  scope: [SCOPE],
  prompt: "consent",
});

const server = http.createServer(async (req, res) => {
  if (!req.url || !req.url.startsWith("/oauth2callback")) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  const u = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const code = u.searchParams.get("code");
  const err = u.searchParams.get("error");
  if (err) {
    res.writeHead(400);
    res.end(`OAuth error: ${err}`);
    server.close();
    process.exit(1);
    return;
  }
  if (!code) {
    res.writeHead(400);
    res.end("Missing code");
    server.close();
    process.exit(1);
    return;
  }

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<p>Success. You can close this tab and return to the terminal.</p>");
    server.close();

    console.log("\n--- Add these to .env.local (never commit) ---\n");
    console.log(`GSC_OAUTH_REFRESH_TOKEN=${tokens.refresh_token || "(no refresh token — revoke app access and retry with prompt consent)"}`);
    if (tokens.access_token) {
      console.log("# access_token expires; use refresh_token above for scripts.");
    }
    console.log("\nOptional: verify sites with:");
    console.log("  GSC_OAUTH_REFRESH_TOKEN=... GSC_OAUTH_CLIENT_SECRETS_PATH=... node scripts/gsc-search-analytics.mjs --sites\n");
    process.exit(0);
  } catch (e) {
    res.writeHead(500);
    res.end(String(e?.message || e));
    server.close();
    console.error(e);
    process.exit(1);
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Open this URL in your browser (redirect: ${REDIRECT}):\n\n${authUrl}\n`);
  console.log(
    "If Google shows redirect_uri_mismatch, add this exact URI under OAuth client → Authorized redirect URIs:\n",
    REDIRECT,
    "\n"
  );
});
