/**
 * Tierheim Wetzlar scraper.
 *
 * WordPress blog format. Each dog is a `## [Name](profileUrl "Title")` heading
 * on the category listing page. A thumbnail image appears BEFORE the heading:
 *   [![Image N](thumbUrl)](profileUrl "Name")
 *   ## [Name](profileUrl "Name")
 *   Teaser text…
 *   [Weiterlesen... Name](profileUrl)
 *
 * The listing has 2 pages. We fetch both in parallel.
 */
import { slugify, stableId, cleanupMarkdown, uniqueStrings, deriveAgeLabel } from '../utils.js';

const JINA_BASE   = 'https://r.jina.ai/';
const BASE_URL    = 'https://tierheim-wetzlar.de';
const LISTING_URL = `${BASE_URL}/category/tiere/hunde/`;
const SHELTER_URL = 'https://tierheim-wetzlar.de';

const PAGE_URLS = [
  LISTING_URL,
  `${LISTING_URL}page/2/`,
];

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

const SKIP = ['hunde', 'tiere', 'kontakt', 'impressum', 'datenschutz', 'navigation', 'tierheim', 'kategorie'];

export async function scrapeWetzlar() {
  try {
    const results = await Promise.allSettled(PAGE_URLS.map(url => fetchWithJina(url)));

    const dogs = [];
    const seen = new Set();

    for (const result of results) {
      if (result.status !== 'fulfilled') continue;
      const text = cleanupMarkdown(result.value);

      // Remove footer navigation
      const footerIdx = text.search(/\n#{1,3}\s+(Kontakt|Impressum|Datenschutz|Über uns|Navigation|Sidebar)/i);
      const content   = footerIdx > 0 ? text.slice(0, footerIdx) : text;

      // Find all H2 dog headings: ## [Name](profileUrl "Title")
      // Also captures plain ## [Name](url) without title attribute
      const headingPattern = /\n##\s+\[([^\]]+)\]\(([^)\s"]+)[^)]*\)/g;
      const headings = [];
      let m;
      while ((m = headingPattern.exec(content)) !== null) {
        const name       = m[1].trim();
        const profileUrl = m[2].trim();
        headings.push({ name, profileUrl, pos: m.index });
      }

      for (let i = 0; i < headings.length; i++) {
        const { name, profileUrl, pos } = headings[i];
        const nameLc = name.toLowerCase();
        if (!name || seen.has(name)) continue;
        if (SKIP.some(s => nameLc === s || nameLc.startsWith(s + ' '))) continue;
        if (name.length > 60) continue;
        seen.add(name);

        // Thumbnail is in the block BEFORE this heading (between previous heading and this one)
        const prevPos     = i > 0 ? headings[i - 1].pos : 0;
        const beforeBlock = content.slice(prevPos, pos);
        const imgMatch    = beforeBlock.match(/\[!\[Image \d+\]\(([^)]+)\)\]\(/);
        const thumbnailUrl = imgMatch ? imgMatch[1] : null;

        // Teaser description is in the block AFTER the heading (up to next heading)
        const nextPos    = i < headings.length - 1 ? headings[i + 1].pos : content.length;
        const afterBlock = content.slice(pos, nextPos);
        const descLines  = afterBlock
          .split('\n')
          .slice(1)
          .map(l => l.trim())
          .filter(l => l && !l.startsWith('[') && !l.startsWith('#') && !l.startsWith('[!['));
        const description = descLines.join(' ').slice(0, 400);

        dogs.push({
          id: stableId('wetzlar', name),
          name,
          slug: slugify(name),
          shelter: 'Tierheim Lahn-Dill',
          shelterCity: 'Wetzlar',
          shelterPhone: '06441 / 45 15 0',
          shelterEmail: 'info@tierheim-wetzlar.de',
          shelterUrl: SHELTER_URL,
          profileUrl,
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
          description,
          status: 'available',
          scrapedAt: new Date().toISOString(),
        });
      }
    }

    console.log(`[Wetzlar] ${dogs.length} dogs parsed`);
    return dogs;
  } catch (err) {
    console.error('[Wetzlar] Scraper error:', err.message);
    return [];
  }
}
