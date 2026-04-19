#!/usr/bin/env node
/**
 * Search Console search analytics (queries, pages, position, country, device, etc.)
 *
 * Env: GSC_OAUTH_*, GSC_SITE_URL (see .env.example)
 *
 * Examples:
 *   npm run gsc:report
 *   npm run gsc:report -- --sites
 *   npm run gsc:report -- --dimensions query,page --days 90 --limit 100
 *   npm run gsc:report -- --format csv --output ./out.csv --dimensions page --days 28
 *   npm run gsc:report -- --dimensions country --days 28
 *   npm run gsc:report -- --dimensions device --days 28 --start-row 25000
 */
import fs from "fs";
import {
  createSearchConsoleClient,
  requireSiteUrl,
  searchAnalyticsRowsToCsv,
} from "./gsc-lib.mjs";

function parseArgs() {
  const argv = process.argv.slice(2);
  const out = {
    sitesOnly: false,
    days: 28,
    limit: 2500,
    dimensions: ["query"],
    format: "json",
    output: null,
    startRow: 0,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--sites") out.sitesOnly = true;
    else if (a === "--days" && argv[i + 1]) out.days = Number(argv[++i]);
    else if (a === "--limit" && argv[i + 1]) out.limit = Number(argv[++i]);
    else if (a === "--dimensions" && argv[i + 1]) {
      out.dimensions = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    } else if (a === "--format" && argv[i + 1])
      out.format = String(argv[++i]).toLowerCase();
    else if (a === "--output" && argv[i + 1]) out.output = argv[++i];
    else if (a === "--start-row" && argv[i + 1])
      out.startRow = Number(argv[++i]);
  }
  return out;
}

async function main() {
  const opts = parseArgs();
  const { sc } = createSearchConsoleClient();

  if (opts.sitesOnly) {
    const { data } = await sc.sites.list({});
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  const siteUrl = requireSiteUrl();

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - opts.days);
  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);

  const body = {
    startDate,
    endDate,
    dimensions: opts.dimensions,
    rowLimit: Math.min(Math.max(opts.limit, 1), 25000),
  };
  if (opts.startRow > 0) body.startRow = opts.startRow;

  const { data } = await sc.searchanalytics.query({
    siteUrl,
    requestBody: body,
  });

  const rows = data.rows || [];

  if (opts.format === "csv") {
    const csv = searchAnalyticsRowsToCsv(rows, opts.dimensions);
    if (opts.output) {
      fs.writeFileSync(opts.output, csv, "utf8");
      console.error(`Wrote ${opts.output} (${rows.length} rows)`);
    } else {
      process.stdout.write(csv);
    }
    return;
  }

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
