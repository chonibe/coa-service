/**
 * Apply fetched portfolio images to wiki entity pages.
 * Adds/replaces the "Portfolio Images" section in each artist's wiki page.
 *
 * Run: node scripts/apply-portfolio-images-to-wiki.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const fetched = JSON.parse(readFileSync(join(ROOT, 'docs/dev/wiki-portfolio-images.json'), 'utf8'));
const WIKI_ENTITIES = join(ROOT, 'wiki/entities');

// Junk og:image patterns to skip
const JUNK = [
  'blank.jpg',
  'logo.jpg',
  'LOGO_',
  'favicon',
  'icon.jpg',
  '/share.jpg', // generic share images
];

function isJunkImage(url) {
  if (!url) return true;
  return JUNK.some(j => url.includes(j));
}

// Filter work images — skip junk, prefer artwork-looking URLs
function filterWorkImages(images, slug) {
  return images.filter(url => {
    if (!url) return false;
    if (url.includes('data:')) return false;
    if (url.includes('logo') || url.includes('favicon') || url.includes('icon')) return false;
    if (url.includes('1x1') || url.includes('pixel') || url.includes('spacer')) return false;
    if (url.includes('blank')) return false;
    if (url.includes('spinner') || url.includes('.gif')) return false;
    if (url.includes('placeholder') || url.includes('loading')) return false;
    return true;
  }).slice(0, 6); // Max 6 work images
}

let updated = 0;
let skipped = 0;

for (const [slug, data] of Object.entries(fetched)) {
  const wikiPath = join(WIKI_ENTITIES, `${slug}.md`);
  if (!existsSync(wikiPath)) {
    console.log(`SKIP (no wiki page): ${slug}`);
    skipped++;
    continue;
  }

  const ogImage = !isJunkImage(data.ogImage) ? data.ogImage : null;
  const workImages = filterWorkImages(data.workImages || [], slug);

  if (!ogImage && workImages.length === 0) {
    console.log(`SKIP (no usable images): ${slug}`);
    skipped++;
    continue;
  }

  let content = readFileSync(wikiPath, 'utf8');

  // Build the new "Portfolio Images" section
  const lines = [];
  lines.push('## Portfolio Images');
  lines.push('');
  lines.push('*Fetched from artist portfolio/about pages. Verify rights before republishing.*');
  lines.push('');

  if (ogImage) {
    lines.push('### Primary Image');
    lines.push(`- **URL**: ${ogImage}`);
    lines.push(`- **Preview**: ![${slug}](${ogImage})`);
    lines.push(`- **Source**: ${data.aboutUrl}`);
    lines.push('');
  }

  if (workImages.length > 0) {
    lines.push('### Work Images');
    lines.push('');
    workImages.forEach((url, i) => {
      lines.push(`- ![Work ${i + 1}](${url})`);
    });
    lines.push('');
  }

  const newSection = lines.join('\n');

  // Insert before "## SEO" section (or before "## Appearances" if no SEO section)
  if (content.includes('## Portfolio Images')) {
    // Replace existing section
    content = content.replace(
      /## Portfolio Images[\s\S]*?(?=\n## |\n---\s*$|$)/,
      newSection
    );
  } else {
    // Insert before ## SEO
    const insertBefore = content.includes('## SEO') ? '## SEO' : '## Appearances';
    content = content.replace(insertBefore, newSection + '\n' + insertBefore);
  }

  writeFileSync(wikiPath, content);
  console.log(`UPDATED: ${slug}.md (og: ${ogImage ? '✓' : '✗'}, works: ${workImages.length})`);
  updated++;
}

console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);
