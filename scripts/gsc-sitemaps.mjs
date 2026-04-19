#!/usr/bin/env node
/**
 * Google Search Console — list or submit sitemaps.
 *
 * Uses GSC_SITE_URL (e.g. sc-domain:thestreetcollector.com).
 *
 * Usage:
 *   npm run gsc:sitemaps -- list
 *   npm run gsc:sitemaps -- submit https://www.thestreetcollector.com/sitemap.xml
 */
import { createSearchConsoleClient, requireSiteUrl } from "./gsc-lib.mjs";

async function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0] || "list";
  const siteUrl = requireSiteUrl();
  const { sc } = createSearchConsoleClient();

  if (cmd === "list") {
    const { data } = await sc.sitemaps.list({ siteUrl });
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (cmd === "submit") {
    const feedpath = argv[1];
    if (!feedpath) {
      console.error(
        "Usage: npm run gsc:sitemaps -- submit https://example.com/sitemap.xml"
      );
      process.exit(1);
    }
    await sc.sitemaps.submit({ siteUrl, feedpath });
    console.error(`Submitted sitemap: ${feedpath}`);
    return;
  }

  console.error("Unknown command. Use: list | submit <sitemap-url>");
  process.exit(1);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
