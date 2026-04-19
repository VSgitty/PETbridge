/**
 * TSV Gießen scraper.
 *
 * WooCommerce product catalog. Dogs appear across 3 pages as ## headings.
 * Each dog block looks like (after Jina renders it):
 *   [![Image N](thumb300x300)](productUrl)
 *   ## DogName – status
 *   [Weiterlesen](productUrl)
 *
 * The status suffix is separated by an en-dash (–):
 *   "Amanda"                                   → available
 *   "Amanda – reserviert"                      → reserved
 *   "Brownie – Nicht zu vermitteln – Paten gesucht" → sponsor
 *
 * We fetch all 3 pages in parallel.
 */
import { slugify, stableId, cleanupMarkdown, uniqueStrings, deriveAgeLabel } from '../utils.js';

const JINA_BASE   = 'https://r.jina.ai/';
const SHELTER_URL = 'https://tsv-giessen.de';
const TOTAL_PAGES = 3;

function pageUrl(page) {
  return `${SHELTER_URL}/?paged=${page}&product_cat=hunde`;
}

async function fetchWithJina(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 28000);
  try {
    const res = await fetch(`${JINA_BASE}${url}`, {
      headers: { 'User-Agent': 'PetBridge/1.0', Accept: 'text/markdown' },
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  } finally {
    clearTimeout(timer);
  }
}

const SKIP_HEADINGS = [
  'hunde', 'kategorien', 'navigation', 'kontakt', 'impressum', 'datenschutz',
  'shop', 'wunsch', 'junghunde', 'kleine hunde', 'mittlere hunde', 'große hunde',
  'besondere hunde',
];

export async function scrapeTsvGiessen() {
  try {
    const results = await Promise.allSettled(
      Array.from({ length: TOTAL_PAGES }, (_, i) => fetchWithJina(pageUrl(i + 1)))
    );

    const dogs = [];
    const seen = new Set();

    for (const result of results) {
      if (result.status !== 'fulfilled') continue;
      const text = cleanupMarkdown(result.value);

      // Cut footer
      const footerIdx = text.search(/\n#{1,3}\s+(Kontakt|Impressum|Datenschutz|Footer|Navigation)/i);
      const content   = footerIdx > 0 ? text.slice(0, footerIdx) : text;

      // Find all ## headings
      const headingPattern = /\n##\s+([^\n]+)/g;
      const headings = [];
      let m;
      while ((m = headingPattern.exec(content)) !== null) {
        headings.push({ fullName: m[1].trim(), pos: m.index });
      }

      for (let i = 0; i < headings.length; i++) {
        const { fullName, pos } = headings[i];
        const nameLc = fullName.toLowerCase();

        // Skip non-dog headings
        if (SKIP_HEADINGS.some(s => nameLc === s || nameLc.startsWith(s))) continue;
        if (fullName.length > 100) continue;

        // Parse name and status from heading  (separator: en-dash –)
        const parts      = fullName.split(/\s*[–\-]\s*/u);
        const name       = parts[0].trim();
        const statusText = parts.slice(1).join(' ').toLowerCase();

        if (!name || seen.has(name)) continue;
        seen.add(name);

        let status = 'available';
        if (statusText.includes('reserviert'))                     status = 'reserved';
        else if (statusText.includes('paten') || statusText.includes('nicht zu vermitteln')) status = 'sponsor';

        // Thumbnail image is in the block BEFORE this heading
        const prevPos     = i > 0 ? headings[i - 1].pos : 0;
        const beforeBlock = content.slice(prevPos, pos);
        const imgMatch    = beforeBlock.match(/\[!\[Image \d+\]\(([^)]+)\)\]\(([^)]+)\)/);
        const thumbnailUrl = imgMatch ? imgMatch[1] : null;
        const profileUrl   = imgMatch ? imgMatch[2] : pageUrl(1);

        dogs.push({
          id: stableId('tsv-giessen', name),
          name,
          slug: slugify(name),
          shelter: 'TSV Gießen',
          shelterCity: 'Gießen (TSV)',
          shelterPhone: '',
          shelterEmail: '',
          shelterUrl: SHELTER_URL,
          profileUrl: profileUrl.trim(),
          image: thumbnailUrl  || null,
          images: thumbnailUrl ? [thumbnailUrl] : [],
          breed: '',
          birthText: '',
          ageLabel: '',
          sex: '',
          neuteredStatus: '',
          size: '',
          weight: '',
          color: '',
          since: '',
          description: '',
          status,
          scrapedAt: new Date().toISOString(),
        });
      }
    }

    console.log(`[TSV Gießen] ${dogs.length} dogs parsed`);
    return dogs;
  } catch (err) {
    console.error('[TSV Gießen] Scraper error:', err.message);
    return [];
  }
}
