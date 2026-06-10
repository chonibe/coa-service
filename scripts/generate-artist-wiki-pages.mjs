/**
 * Generate Obsidian wiki entity pages for all artists in artist-research-data.json
 * Output: wiki/entities/<slug>.md for each artist
 *
 * Run: node scripts/generate-artist-wiki-pages.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const data = JSON.parse(readFileSync(join(ROOT, 'content/artist-research-data.json'), 'utf8'));
const WIKI_ENTITIES = join(ROOT, 'wiki/entities');

// Dedup: prefer slug without "-1" suffix if both exist with same artistName
const seenNames = new Map();
const toSkip = new Set();
for (const [slug, artist] of Object.entries(data)) {
  const name = artist.artistName?.toLowerCase().trim();
  if (!name) continue;
  if (seenNames.has(name)) {
    const existing = seenNames.get(name);
    if (slug.match(/-\d+$/)) {
      toSkip.add(slug);
    } else {
      toSkip.add(existing);
      seenNames.set(name, slug);
    }
  } else {
    seenNames.set(name, slug);
  }
}

const TODAY = '2026-04-14';
const SOURCE_SLUG = '2026-04-14-artist-research-data';

function escapeYaml(str) {
  if (!str) return '';
  return str.replace(/"/g, '\\"').replace(/\n/g, ' ').trim();
}

/** Parse processImageNUrl / processImageNLabel pairs into array */
function parseProcessImages(artist) {
  const images = [];
  for (let i = 1; i <= 4; i++) {
    const url = artist[`processImage${i}Url`]?.trim();
    const label = artist[`processImage${i}Label`]?.trim() || 'Portfolio';
    if (url) images.push({ url, label });
  }
  return images;
}

/** Parse instagramPostImageUrls (newline or comma separated) */
function parseIgImages(raw) {
  if (!raw?.trim()) return [];
  return raw.split(/[\n,]/).map(l => l.trim()).filter(l => l.startsWith('http'));
}

/** Parse exhibitions text into clean bullet list */
function formatExhibitions(raw) {
  if (!raw?.trim()) return null;
  return raw.split('\n').map(l => l.trim()).filter(Boolean).map(l => `- ${l}`).join('\n');
}

/** Parse press text into clean bullet list */
function formatPress(raw) {
  if (!raw?.trim()) return null;
  return raw.split('\n').map(l => l.trim()).filter(Boolean).map(l => `- ${l}`).join('\n');
}

/** Extract clean source URLs */
function parseSourceUrls(raw) {
  if (!raw?.trim()) return [];
  return raw.split('\n').map(l => l.trim()).filter(l => l.startsWith('http'));
}

/** Derive location tags */
function locationTags(location) {
  const tags = [];
  if (!location) return tags;
  if (location.includes('France')) tags.push('france');
  if (location.includes('Germany')) tags.push('germany');
  if (location.includes('Israel')) tags.push('israel');
  if (location.includes('United Kingdom') || location.includes('England')) tags.push('uk');
  if (location.includes('United States') || location.includes('USA') || location.includes('Texas') || location.includes('New York') || location.includes('California') || location.includes('Los Angeles')) tags.push('usa');
  if (location.includes('Netherlands')) tags.push('netherlands');
  if (location.includes('Belgium')) tags.push('belgium');
  if (location.includes('Australia')) tags.push('australia');
  if (location.includes('Japan')) tags.push('japan');
  if (location.includes('Canada')) tags.push('canada');
  if (location.includes('Italy')) tags.push('italy');
  if (location.includes('Spain')) tags.push('spain');
  if (location.includes('Portugal')) tags.push('portugal');
  if (location.includes('Brazil')) tags.push('brazil');
  if (location.includes('Mexico')) tags.push('mexico');
  if (location.includes('Argentina')) tags.push('argentina');
  if (location.includes('Indonesia') || location.includes('Bali')) tags.push('indonesia');
  if (location.includes('Thailand')) tags.push('thailand');
  if (location.includes('Philippines')) tags.push('philippines');
  if (location.includes('Romania')) tags.push('romania');
  if (location.includes('Switzerland')) tags.push('switzerland');
  if (location.includes('Ecuador')) tags.push('ecuador');
  if (location.includes('Serbia')) tags.push('serbia');
  if (location.includes('Czech')) tags.push('czech-republic');
  if (location.includes('Poland')) tags.push('poland');
  if (location.includes('Tokyo')) tags.push('japan');
  return [...new Set(tags)];
}

/** Build SEO keyword list from artist data */
function buildSeoKeywords(name, location, story, hook) {
  const keywords = [name];
  // Location keyword
  if (location) {
    const city = location.split(',')[0].trim();
    if (city) keywords.push(city + ' artist');
  }
  // Medium/style keywords extracted from story
  const text = (story + ' ' + hook).toLowerCase();
  if (text.includes('street art') || text.includes('mural')) keywords.push('street artist');
  if (text.includes('illustrat')) keywords.push('illustrator');
  if (text.includes('collage')) keywords.push('collage artist');
  if (text.includes('graffiti')) keywords.push('graffiti artist');
  if (text.includes('vector')) keywords.push('vector illustrator');
  if (text.includes('mural')) keywords.push('muralist');
  keywords.push(`${name} prints`);
  keywords.push(`${name} limited edition`);
  keywords.push(`${name} street art print`);
  keywords.push('Street Collector');
  keywords.push('limited edition street art');
  keywords.push('certificate of authenticity art print');
  return [...new Set(keywords)];
}

/** Build meta description from hook and location */
function buildMetaDescription(name, hook, location) {
  // Strip Instagram handle from hook
  const cleanHook = hook?.replace(/ \(@[^)]+\)$/, '').trim() || '';
  const locationStr = location ? ` Based in ${location.split(';')[0].split('(')[0].trim()}.` : '';
  const suffix = ` Collect limited edition prints on Street Collector with Certificate of Authenticity.`;
  const desc = cleanHook + locationStr + suffix;
  return desc.length > 160 ? desc.substring(0, 157) + '...' : desc;
}

/** Build FAQ pairs for SEO */
function buildFaqs(name, location) {
  const cityStr = location ? location.split(',')[0].trim() + ' ' : '';
  return [
    {
      q: `Is ${name}'s work available as a limited edition print?`,
      a: `Yes. Collect ${name}'s limited edition street art prints on Street Collector, shipped with a Certificate of Authenticity (COA).`,
    },
    {
      q: `Where is ${name} from?`,
      a: location
        ? `${name} is based in ${location.split(';')[0].split('(')[0].trim()}.`
        : `${name} is a featured artist on The Street Collector platform.`,
    },
    {
      q: `What style does ${name} work in?`,
      a: `See the full bio and process images above. Browse ${name}'s editions on The Street Collector for direct examples of their work.`,
    },
    {
      q: `What is Street Collector?`,
      a: `Street Collector is an illuminated art lamp with swappable limited-edition street art prints. Collect prints from independent artists, display them backlit, and own editioned work with a Certificate of Authenticity.`,
    },
  ];
}

/** Format additional history — strip enrichment run notes, keep the main CV text */
function formatHistory(raw) {
  if (!raw?.trim()) return null;
  // Strip lines that are clearly internal/enrichment metadata
  const lines = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const cleaned = lines.filter(l => {
    if (l.startsWith('[') && l.endsWith(']')) return false;
    if (l.toLowerCase().includes('verify before publishing')) return false;
    if (l.toLowerCase().includes('enrichment pass')) return false;
    if (l.toLowerCase().includes('auto-extracted')) return false;
    return true;
  });
  if (cleaned.length === 0) return null;
  return cleaned.join('\n');
}

let created = 0;
let skipped = 0;

for (const [slug, artist] of Object.entries(data)) {
  if (toSkip.has(slug)) {
    console.log(`SKIP (duplicate): ${slug}`);
    skipped++;
    continue;
  }

  const name = artist.artistName || slug;
  const location = artist.location || '';
  const activeSince = artist.activeSince || '';
  const heroHook = artist.heroHook || '';
  const story = artist.storyFullText || '';
  const instagramHandle = artist.instagramHandle || '';
  const aboutPageUrl = artist.aboutPageUrl || '';
  const pullQuote = artist.pullQuote || '';
  const exhibitionsText = artist.exhibitionsText || '';
  const pressText = artist.pressText || '';
  const impactCallout = artist.impactCallout?.trim() || '';
  const exclusiveCallout = artist.exclusiveCallout?.trim() || '';
  const additionalHistory = formatHistory(artist.additionalHistoryText || '');
  const sourcesLinks = parseSourceUrls(artist.sourcesLinks || '');
  const shopUrl = `https://thestreetcollector.com/collections/${slug}`;
  const processImages = parseProcessImages(artist);
  const igImages = parseIgImages(artist.instagramPostImageUrls || '');

  const tags = ['artist', 'street-collector', ...locationTags(location)];
  const seoKeywords = buildSeoKeywords(name, location, story, heroHook);
  const metaDescription = buildMetaDescription(name, heroHook, location);
  const faqs = buildFaqs(name, location);
  const exhibitionsSection = formatExhibitions(exhibitionsText);
  const pressSection = formatPress(pressText);

  const lines = [];

  // ── Frontmatter ──────────────────────────────────────────────────────────
  lines.push('---');
  lines.push(`title: "${escapeYaml(name)}"`);
  lines.push(`type: entity`);
  lines.push(`tags: [${tags.join(', ')}]`);
  lines.push(`created: ${TODAY}`);
  lines.push(`updated: ${TODAY}`);
  lines.push(`sources: [${SOURCE_SLUG}]`);
  lines.push('---');
  lines.push('');

  // ── Title + one-liner ─────────────────────────────────────────────────────
  lines.push(`# ${name}`);
  lines.push('');
  const cleanHook = heroHook.replace(/ \(@[^)]+\)$/, '').trim();
  lines.push(cleanHook || `${name} is a Street Collector featured artist.`);
  lines.push('');

  // ── Overview ──────────────────────────────────────────────────────────────
  lines.push('## Overview');
  lines.push('');
  lines.push(story || cleanHook || `${name} is a featured artist on The Street Collector.`);
  lines.push('');

  // ── Key Facts ─────────────────────────────────────────────────────────────
  lines.push('## Key Facts');
  lines.push('');
  if (location) lines.push(`- **Location**: ${location}`);
  if (activeSince) lines.push(`- **Active since**: ${activeSince}`);
  if (instagramHandle) lines.push(`- **Instagram**: ${instagramHandle}`);
  if (aboutPageUrl) lines.push(`- **Portfolio / About**: ${aboutPageUrl}`);
  lines.push(`- **Shop collection**: ${shopUrl}`);
  lines.push('');

  // ── Pull quote ────────────────────────────────────────────────────────────
  if (pullQuote) {
    lines.push('## Voice');
    lines.push('');
    lines.push(`> ${pullQuote}`);
    lines.push('');
  }

  // ── Impact callout ────────────────────────────────────────────────────────
  if (impactCallout) {
    lines.push('## Impact');
    lines.push('');
    lines.push(`> **Impact note:** ${impactCallout}`);
    lines.push('');
  }

  // ── Exclusive callout ─────────────────────────────────────────────────────
  if (exclusiveCallout) {
    lines.push('## Editions & Exclusivity');
    lines.push('');
    lines.push(`> **Editions note:** ${exclusiveCallout}`);
    lines.push('');
  }

  // ── Process Images ────────────────────────────────────────────────────────
  if (processImages.length > 0) {
    lines.push('## Process Images');
    lines.push('');
    lines.push('*Sourced from portfolio, press, and artist websites. Verify rights before republishing.*');
    lines.push('');
    processImages.forEach((img, i) => {
      lines.push(`### Image ${i + 1}`);
      lines.push(`- **URL**: ${img.url}`);
      lines.push(`- **Label**: ${img.label}`);
      lines.push(`- **Preview**: ![${img.label}](${img.url})`);
      lines.push('');
    });
  }

  // ── Instagram showcase ────────────────────────────────────────────────────
  if (igImages.length > 0) {
    lines.push('## Instagram Showcase');
    lines.push('');
    lines.push(`**Handle**: ${instagramHandle}`);
    lines.push('');
    igImages.forEach((url, i) => {
      lines.push(`- ![Post ${i + 1}](${url})`);
    });
    lines.push('');
  } else if (instagramHandle) {
    lines.push('## Instagram');
    lines.push('');
    const handle = instagramHandle.replace('@', '');
    lines.push(`- **Handle**: ${instagramHandle}`);
    lines.push(`- **Profile**: https://www.instagram.com/${handle}/`);
    lines.push('');
  }

  // ── Exhibitions ───────────────────────────────────────────────────────────
  if (exhibitionsSection) {
    lines.push('## Exhibitions');
    lines.push('');
    lines.push(exhibitionsSection);
    lines.push('');
  }

  // ── Press ─────────────────────────────────────────────────────────────────
  if (pressSection) {
    lines.push('## Press');
    lines.push('');
    lines.push(pressSection);
    lines.push('');
  }

  // ── Additional History / CV ───────────────────────────────────────────────
  if (additionalHistory) {
    lines.push('## Additional History & CV');
    lines.push('');
    lines.push('*Research notes — verify facts against primary sources before publishing.*');
    lines.push('');
    lines.push(additionalHistory);
    lines.push('');
  }

  // ── SEO ───────────────────────────────────────────────────────────────────
  lines.push('## SEO');
  lines.push('');
  lines.push(`**Page title**: ${name} — Limited Edition Street Art Prints | Street Collector`);
  lines.push('');
  lines.push(`**Meta description**: ${metaDescription}`);
  lines.push('');
  lines.push(`**Target keywords**:`);
  seoKeywords.forEach(kw => lines.push(`- ${kw}`));
  lines.push('');

  // ── FAQ (SEO structured data) ─────────────────────────────────────────────
  lines.push('## FAQ');
  lines.push('');
  lines.push('*For FAQPage JSON-LD structured data on the artist profile page.*');
  lines.push('');
  faqs.forEach(({ q, a }) => {
    lines.push(`**Q: ${q}**`);
    lines.push(`A: ${a}`);
    lines.push('');
  });

  // ── Appearances ───────────────────────────────────────────────────────────
  lines.push('## Appearances');
  lines.push('');
  lines.push(`- [[${SOURCE_SLUG}]] — artist research data used to build this page`);
  lines.push('');

  // ── Source Links ──────────────────────────────────────────────────────────
  if (sourcesLinks.length) {
    lines.push('## Source Links');
    lines.push('');
    sourcesLinks.forEach(url => lines.push(`- ${url}`));
    lines.push('');
  }

  // ── Related ───────────────────────────────────────────────────────────────
  lines.push('## Related');
  lines.push('');
  lines.push('- [[the-street-collector]]');
  lines.push('- [[2026-04-14-street-collector-artists]]');
  lines.push('');

  const outPath = join(WIKI_ENTITIES, `${slug}.md`);
  writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log(`CREATED: ${slug}.md`);
  created++;
}

console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
