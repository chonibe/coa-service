#!/usr/bin/env node
/**
 * Query Search Console search analytics (queries/pages + average position).
 *
 * Env:
 *   GSC_OAUTH_CLIENT_SECRETS_PATH — path to client_secret JSON (same as oauth script)
 *   GSC_OAUTH_REFRESH_TOKEN — from gsc-oauth-token.mjs
 *   GSC_SITE_URL — must match the property in Search Console exactly, e.g.
 *     https://www.thestreetcollector.com/
 *     or sc-domain:thestreetcollector.com
 *
 * Usage:
 *   node scripts/gsc-search-analytics.mjs
 *   node scripts/gsc-search-analytics.mjs --sites
 *   node scripts/gsc-search-analytics.mjs --dimensions query,page --days 90 --limit 50
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(REPO_ROOT, ".env.local") });
dotenv.config();

function parseArgs() {
  const argv = process.argv.slice(2);
  const out = { sitesOnly: false, days: 28, limit: 25, dimensions: ["query"] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--sites") out.sitesOnly = true;
    else if (argv[i] === "--days" && argv[i + 1]) {
      out.days = Number(argv[++i]);
    } else if (argv[i] === "--limit" && argv[i + 1]) {
      out.limit = Number(argv[++i]);
    } else if (argv[i] === "--dimensions" && argv[i + 1]) {
      out.dimensions = argv[++i].split(",").map((s) => s.trim());
    }
  }
  return out;
}

function loadOAuthClient() {
  const secretsPath = process.env.GSC_OAUTH_CLIENT_SECRETS_PATH;
  const refreshToken = process.env.GSC_OAUTH_REFRESH_TOKEN;
  if (!secretsPath || !fs.existsSync(secretsPath)) {
    throw new Error("Set GSC_OAUTH_CLIENT_SECRETS_PATH to your client_secret JSON path.");
  }
  if (!refreshToken) {
    throw new Error(
      "Set GSC_OAUTH_REFRESH_TOKEN (run node scripts/gsc-oauth-token.mjs once)."
    );
  }
  const raw = JSON.parse(fs.readFileSync(secretsPath, "utf8"));
  const web = raw.web || raw.installed;
  const oAuth2Client = new google.auth.OAuth2(
    web.client_id,
    web.client_secret
  );
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  return oAuth2Client;
}

async function main() {
  const opts = parseArgs();
  const auth = loadOAuthClient();
  const sc = google.searchconsole({ version: "v1", auth });

  if (opts.sitesOnly) {
    const { data } = await sc.sites.list({});
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  const siteUrl = process.env.GSC_SITE_URL;
  if (!siteUrl) {
    throw new Error(
      'Set GSC_SITE_URL to your exact Search Console property, e.g. https://www.thestreetcollector.com/ or sc-domain:thestreetcollector.com'
    );
  }

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - opts.days);
  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);

  const { data } = await sc.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: opts.dimensions,
      rowLimit: opts.limit,
    },
  });

  const rows = data.rows || [];
  console.log(
    JSON.stringify(
      {
        siteUrl,
        startDate,
        endDate,
        dimensions: opts.dimensions,
        rowCount: rows.length,
        rows: rows.map((r) => ({
          keys: r.keys,
          clicks: r.clicks,
          impressions: r.impressions,
          ctr: r.ctr,
          position: r.position,
        })),
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
