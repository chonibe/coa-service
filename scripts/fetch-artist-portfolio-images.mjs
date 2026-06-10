/**
 * Fetch og:image and portfolio images for artists missing instagramPostImageUrls.
 * Writes results to docs/dev/wiki-portfolio-images.json
 *
 * Run: node scripts/fetch-artist-portfolio-images.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const data = JSON.parse(readFileSync(join(ROOT, 'content/artist-research-data.json'), 'utf8'));
const SKIP = new Set(['antonia-lev-1', 'troy-browne-1']);

// Artists that already have IG images — skip
const hasMaterial = (a) => a.instagramPostImageUrls?.trim();

const targets = Object.entries(data)
  .filter(([slug, a]) => !SKIP.has(slug) && !hasMaterial(a) && a.aboutPageUrl?.startsWith('http'))
  .map(([slug, a]) => ({ slug, name: a.artistName, aboutUrl: a.aboutPageUrl, igHandle: a.instagramHandle }));

console.log(`Fetching images for ${targets.length} artists...\n`);

const TIMEOUT_MS = 8000;
const CONCURRENCY = 6;
const DELAY_MS = 300;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchWithTimeout(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    clearTimeout(timer);
    return null;
  }
}

function resolveUrl(base, href) {
  if (!href || href.startsWith('data:')) return null;
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

function extractImages(html, baseUrl) {
  if (!html) return { ogImage: null, workImages: [] };

  // og:image / twitter:image
  const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  const twitterMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);

  const ogImage = resolveUrl(baseUrl, ogMatch?.[1] || twitterMatch?.[1] || null);

  // Prominent work images — look for CDN patterns, skip tiny/icon URLs
  const imgSrcMatches = [...html.matchAll(/(?:src|data-src|data-lazy-src)=["']([^"']+)["']/gi)]
    .map(m => resolveUrl(baseUrl, m[1]))
    .filter(Boolean)
    .filter(url => {
      // Skip known junk
      if (url.includes('logo') || url.includes('icon') || url.includes('favicon')) return false;
      if (url.includes('.svg')) return false;
      if (url.includes('data:')) return false;
      if (url.includes('1x1') || url.includes('pixel') || url.includes('spacer')) return false;
      // Prefer actual image extensions or CDN patterns
      return url.match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/i)
        || url.includes('cdn.shopify') || url.includes('cdn.myportfolio')
        || url.includes('static.wixstatic') || url.includes('squarespace')
        || url.includes('cloudinary') || url.includes('imgix')
        || url.includes('behance') || url.includes('images.squarespace')
        || url.includes('assets.squarespace');
    });

  // Deduplicate and prefer higher-res variants
  const seen = new Set();
  const workImages = [];
  for (const url of imgSrcMatches) {
    const key = url.split('?')[0];
    if (!seen.has(key)) {
      seen.add(key);
      workImages.push(url);
    }
    if (workImages.length >= 8) break;
  }

  return { ogImage, workImages };
}

// Process in batches
const results = {};
let done = 0;

for (let i = 0; i < targets.length; i += CONCURRENCY) {
  const batch = targets.slice(i, i + CONCURRENCY);
  const settled = await Promise.allSettled(
    batch.map(async ({ slug, name, aboutUrl, igHandle }) => {
      const html = await fetchWithTimeout(aboutUrl);
      const { ogImage, workImages } = extractImages(html, aboutUrl);
      done++;
      const status = ogImage ? '✓' : html ? '~' : '✗';
      console.log(`[${done}/${targets.length}] ${status} ${slug} — og:image: ${ogImage?.substring(0,70) ?? 'none'} | works: ${workImages.length}`);
      return { slug, name, aboutUrl, ogImage, workImages, igHandle };
    })
  );

  for (const s of settled) {
    if (s.status === 'fulfilled' && s.value) {
      const { slug, ...rest } = s.value;
      results[slug] = rest;
    }
  }

  if (i + CONCURRENCY < targets.length) await sleep(DELAY_MS);
}

const outPath = join(ROOT, 'docs/dev/wiki-portfolio-images.json');
writeFileSync(outPath, JSON.stringify(results, null, 2));
console.log(`\nSaved to docs/dev/wiki-portfolio-images.json (${Object.keys(results).length} entries)`);

// Summary
const withOg = Object.values(results).filter(r => r.ogImage).length;
const withWorks = Object.values(results).filter(r => r.workImages.length > 0).length;
console.log(`og:image found: ${withOg}/${Object.keys(results).length}`);
console.log(`Work images found: ${withWorks}/${Object.keys(results).length}`);
