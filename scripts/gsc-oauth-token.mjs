#!/usr/bin/env node
/**
 * One-time OAuth2 for Google Search Console API (read-only).
 *
 * Prereqs:
 * 1. Google Cloud: enable "Google Search Console API" for the project.
 * 2. OAuth client (Web): add Authorized redirect URI:
 *    http://127.0.0.1:3333/oauth2callback  (PORT from GSC_OAUTH_PORT or default 3333)
 * 3. Env: GSC_OAUTH_CLIENT_SECRETS_PATH=/absolute/path/to/client_secret_....json
 *
 * Usage:
 *   npm run gsc:oauth
 *   Leave the terminal RUNNING until the browser shows "Success". Closing the terminal
 *   stops the local server → Chrome shows ERR_CONNECTION_REFUSED on the redirect.
 *
 * Recovery (if you saw connection refused but Google already approved):
 *   The address bar may still contain ?code=... Copy the ENTIRE URL and run:
 *   npm run gsc:oauth -- --url='http://127.0.0.1:3333/oauth2callback?code=...'
 *   Or: npm run gsc:oauth -- --code=PASTE_CODE_ONLY
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

function parseManualCode() {
  const args = process.argv.slice(2);
  let code = null;
  for (const a of args) {
    if (a.startsWith("--code=")) {
      code = a.slice("--code=".length).trim();
    } else if (a.startsWith("--url=")) {
      const raw = a.slice("--url=".length).trim().replace(/^['"]|['"]$/g, "");
      try {
        const u = new URL(raw);
        code = u.searchParams.get("code");
      } catch {
        console.error("Invalid --url= value (must be full redirect URL with ?code=)");
        process.exit(1);
      }
    } else if (a.startsWith("http") && a.includes("code=")) {
      try {
        const u = new URL(a);
        code = u.searchParams.get("code");
      } catch {
        /* ignore */
      }
    }
  }
  return code;
}

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

async function exchangeAndPrintTokens(code) {
  if (!code) {
    console.error("No authorization code found.");
    process.exit(1);
  }
  const { tokens } = await oAuth2Client.getToken(code);
  console.log("\n--- Add these to .env.local (never commit) ---\n");
  console.log(
    `GSC_OAUTH_REFRESH_TOKEN=${tokens.refresh_token || "(no refresh token — revoke app access at https://myaccount.google.com/permissions and retry)"}`
  );
  if (tokens.access_token) {
    console.log("# access_token expires; use refresh_token above for scripts.");
  }
  console.log("\nThen: npm run gsc:report\n");
  process.exit(0);
}

const manualCode = parseManualCode();
if (manualCode) {
  exchangeAndPrintTokens(manualCode).catch((e) => {
    console.error(e?.message || e);
    process.exit(1);
  });
} else {
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
      console.log(
        `GSC_OAUTH_REFRESH_TOKEN=${tokens.refresh_token || "(no refresh token — revoke app access and retry)"}`
      );
      if (tokens.access_token) {
        console.log("# access_token expires; use refresh_token above for scripts.");
      }
      console.log("\nThen: npm run gsc:report\n");
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
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  LOCAL SERVER IS RUNNING — do not close this terminal yet.");
    console.log("  After Google signs you in, it will redirect to:");
    console.log(`  ${REDIRECT}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("Open this URL in your browser:\n\n", authUrl, "\n");
    console.log(
      "If Google shows redirect_uri_mismatch, add this EXACT redirect URI in Google Cloud → Credentials → your OAuth client:\n",
      REDIRECT,
      "\n"
    );
    console.log(
      "If the tab shows ERR_CONNECTION_REFUSED, this process stopped too soon.\n" +
        "Run `npm run gsc:oauth` again, keep the terminal open, then authorize.\n" +
        "Or copy the full URL from the address bar (with ?code=...) and run:\n" +
        `  npm run gsc:oauth -- --url='PASTE_FULL_URL_HERE'\n`
    );
  });
}
