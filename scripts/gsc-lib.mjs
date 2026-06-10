/**
 * Shared Google Search Console API auth + helpers for CLI scripts.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";
import dotenv from "dotenv";

let envLoaded = false;

export function repoRoot() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(__dirname, "..");
}

export function loadGscEnv() {
  if (envLoaded) return;
  const root = repoRoot();
  dotenv.config({ path: path.join(root, ".env.local") });
  dotenv.config();
  envLoaded = true;
}

/** @returns {{ sc: import('googleapis').searchconsole_v1.Searchconsole, auth: import('googleapis-common').OAuth2Client }} */
export function createSearchConsoleClient() {
  loadGscEnv();
  const secretsPath = process.env.GSC_OAUTH_CLIENT_SECRETS_PATH;
  const refreshToken = process.env.GSC_OAUTH_REFRESH_TOKEN;
  if (!secretsPath || !fs.existsSync(secretsPath)) {
    throw new Error("Set GSC_OAUTH_CLIENT_SECRETS_PATH to your client_secret JSON path.");
  }
  if (!refreshToken) {
    throw new Error(
      "Set GSC_OAUTH_REFRESH_TOKEN (run npm run gsc:oauth once)."
    );
  }
  const raw = JSON.parse(fs.readFileSync(secretsPath, "utf8"));
  const web = raw.web || raw.installed;
  const oAuth2Client = new google.auth.OAuth2(
    web.client_id,
    web.client_secret
  );
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  const sc = google.searchconsole({ version: "v1", auth: oAuth2Client });
  return { sc, auth: oAuth2Client };
}

export function requireSiteUrl() {
  loadGscEnv();
  const siteUrl = process.env.GSC_SITE_URL;
  if (!siteUrl) {
    throw new Error(
      "Set GSC_SITE_URL (use npm run gsc:report -- --sites to list properties)."
    );
  }
  return siteUrl;
}

/** Escape a cell for CSV (RFC-style, minimal). */
export function escapeCsvCell(value) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * @param {Array<{ keys?: string[] | null; clicks?: number | null; impressions?: number | null; ctr?: number | null; position?: number | null }>} rows
 * @param {string[]} dimensions
 */
export function searchAnalyticsRowsToCsv(rows, dimensions) {
  const headers = [...dimensions, "clicks", "impressions", "ctr", "position"];
  const lines = [headers.map(escapeCsvCell).join(",")];
  for (const r of rows) {
    const keys = r.keys || [];
    const cells = [
      ...keys.map((k) => escapeCsvCell(k)),
      escapeCsvCell(r.clicks ?? ""),
      escapeCsvCell(r.impressions ?? ""),
      escapeCsvCell(r.ctr ?? ""),
      escapeCsvCell(r.position ?? ""),
    ];
    lines.push(cells.join(","));
  }
  return lines.join("\n") + "\n";
}
