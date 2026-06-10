#!/usr/bin/env node
/**
 * Export multiple Search Analytics CSV slices for SEO review (local files).
 *
 * Writes under docs/dev/gsc-exports/<timestamp>/ by default.
 *
 * Env: same as other GSC scripts + optional GSC_EXPORT_BASE_DIR
 *
 * Usage:
 *   npm run gsc:export-all
 *   npm run gsc:export-all -- --days 90
 */
import fs from "fs";
import path from "path";
import {
  createSearchConsoleClient,
  requireSiteUrl,
  searchAnalyticsRowsToCsv,
  repoRoot,
} from "./gsc-lib.mjs";

function parseArgs() {
  const argv = process.argv.slice(2);
  let days = 90;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--days" && argv[i + 1]) days = Number(argv[++i]);
  }
  return { days };
}

async function querySlice(sc, siteUrl, dimensions, days, limit, startRow = 0) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  const body = {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    dimensions,
    rowLimit: Math.min(limit, 25000),
  };
  if (startRow > 0) body.startRow = startRow;
  const { data } = await sc.searchanalytics.query({ siteUrl, requestBody: body });
  return data.rows || [];
}

async function main() {
  const { days } = parseArgs();
  const siteUrl = requireSiteUrl();
  const { sc } = createSearchConsoleClient();
  const root = repoRoot();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const baseDir =
    process.env.GSC_EXPORT_BASE_DIR ||
    path.join(root, "docs", "dev", "gsc-exports", stamp);
  fs.mkdirSync(baseDir, { recursive: true });

  const jobs = [
    { name: "queries", dimensions: ["query"], limit: 8000 },
    { name: "pages", dimensions: ["page"], limit: 8000 },
    { name: "queries-by-page", dimensions: ["query", "page"], limit: 5000 },
    { name: "country", dimensions: ["country"], limit: 3000 },
    { name: "device", dimensions: ["device"], limit: 3000 },
  ];

  const meta = { siteUrl, days, exportedAt: new Date().toISOString(), files: [] };

  for (const job of jobs) {
    process.stderr.write(`Fetching ${job.name}…\n`);
    const rows = await querySlice(
      sc,
      siteUrl,
      job.dimensions,
      days,
      job.limit
    );
    const csv = searchAnalyticsRowsToCsv(rows, job.dimensions);
    const file = path.join(baseDir, `${job.name}.csv`);
    fs.writeFileSync(file, csv, "utf8");
    meta.files.push({ file: path.relative(root, file), rows: rows.length });
  }

  fs.writeFileSync(
    path.join(baseDir, "manifest.json"),
    JSON.stringify(meta, null, 2),
    "utf8"
  );
  console.log(JSON.stringify(meta, null, 2));
  process.stderr.write(`\nDone. Output: ${baseDir}\n`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
