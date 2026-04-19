#!/usr/bin/env node
/**
 * Batch URL Inspection (index coverage signals). Uses quota — default delay 1.1s between URLs.
 *
 * Env:
 *   GSC_SITE_URL — property (e.g. sc-domain:thestreetcollector.com)
 *   GSC_URL_INSPECTION_FILE — override path to newline-separated URLs (default: config/gsc-default-urls.txt)
 *   GSC_INSPECT_DELAY_MS — milliseconds between requests (default 1100)
 *
 * Usage:
 *   npm run gsc:inspect
 *   npm run gsc:inspect -- --file /path/to/urls.txt
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createSearchConsoleClient, requireSiteUrl, repoRoot } from "./gsc-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs() {
  const argv = process.argv.slice(2);
  let file = process.env.GSC_URL_INSPECTION_FILE || null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--file" && argv[i + 1]) file = argv[++i];
  }
  return { file };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function summarizeInspection(data) {
  const ir = data?.inspectionResult;
  if (!ir) return { raw: data };
  const idx = ir.indexStatusResult;
  return {
    verdict: idx?.verdict,
    coverageState: idx?.coverageState,
    robotsTxtState: idx?.robotsTxtState,
    indexingState: idx?.indexingState,
    pageFetchState: idx?.pageFetchState,
    lastCrawlTime: idx?.lastCrawlTime,
    googleCanonical: idx?.googleCanonical,
    userCanonical: idx?.userCanonical,
    inspectionResultLink: ir.inspectionResultLink,
  };
}

async function main() {
  const { file } = parseArgs();
  const root = repoRoot();
  const defaultFile = path.join(root, "config", "gsc-default-urls.txt");
  const urlPath = file || defaultFile;
  if (!fs.existsSync(urlPath)) {
    throw new Error(`URL list not found: ${urlPath}`);
  }

  const text = fs.readFileSync(urlPath, "utf8");
  const urls = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  if (urls.length === 0) {
    throw new Error("No URLs in file.");
  }

  const siteUrl = requireSiteUrl();
  const { sc } = createSearchConsoleClient();
  const delayMs = Number(process.env.GSC_INSPECT_DELAY_MS || 1100);

  const results = [];
  for (let i = 0; i < urls.length; i++) {
    const inspectionUrl = urls[i];
    process.stderr.write(`Inspect ${i + 1}/${urls.length} ${inspectionUrl}\n`);
    try {
      const { data } = await sc.urlInspection.index.inspect({
        requestBody: {
          inspectionUrl,
          siteUrl,
          languageCode: "en-US",
        },
      });
      results.push({
        inspectionUrl,
        ok: true,
        summary: summarizeInspection(data),
      });
    } catch (e) {
      results.push({
        inspectionUrl,
        ok: false,
        error: e?.message || String(e),
      });
    }
    if (i < urls.length - 1) await sleep(delayMs);
  }

  console.log(JSON.stringify({ siteUrl, count: results.length, results }, null, 2));
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
