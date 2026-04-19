/**
 * TSV Gießen scraper.
 *
 * WooCommerce product catalog. After Jina renders the page, each dog appears
 * as an INLINE link item (NOT a standalone heading). The exact format is:
 *
 *   [](profileUrl)[![Image N](imgUrl)## Amanda – reserviert](profileUrl)[Weiterlesen](profileUrl)
 *
 * Key observation: the "## Name – status" is embedded INSIDE the link text
 * of a `[![Image ...](url)## Name](profileUrl)` construct. Line breaks may
 * appear within the image alt text (Image\nN) and within the name (Name –\nstatus).
 *
 * Pages: page 1 = /?product_cat=hunde  (no paged= param)
 *         page 2 = /?paged=2&product_cat=hunde
 *         page 3 = /?paged=3&product_cat=hunde
 */
import { slugify, stableId, cleanupMarkdown } from '../utils.js';

const JINA_BASE   = 'https://r.jina.ai/';
const SHELTER_URL = 'https://tsv-giessen.de';

const PAGE_URLS = [
  `${SHELTER_URL}/?product_cat=hunde`,
  `${SHELTER_URL}/?paged=2&product_cat=hunde`,
  `${SHELTER_URL}/?paged=3&product_cat=hunde`,
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

export async function scrapeTsvGiessen() {
  try {
    const results = await Promise.allSettled(PAGE_URLS.map(url => fetchWithJina(url)));

    const dogs = [];
    const seen = new Set();

    for (const result of results) {
      if (result.status !== 'fulfilled') continue;
      const text = cleanupMarkdown(result.value);

      // Pattern: [![Image N (possibly with newline)](imgUrl)## Name – status](profileUrl)
      // Using dotAll flag (s) so [\s\S] isn't needed; dots match newlines.
      // The ## and name/status may contain newlines — normalise them below.
      const dogPattern = /\[!\[[\s\S]*?\]\(([^)\s]+)\)##\s+([\s\S]+?)\]\((https?:\/\/[^)\s]+)\)/g;

      let m;
      while ((m = dogPattern.exec(text)) !== null) {
        const imageUrl   = m[1].trim();
        const rawTitle   = m[2].replace(/\s+/g, ' ').trim(); // "Amanda – reserviert"
        const profileUrl = m[3].trim();

        // Split on en-dash (–) or regular dash to separate name from status
        const parts = rawTitle.split(/\s*[–\-]\s*/u);
        const name  = parts[0].trim();

        if (!name || seen.has(name)) continue;
        // Skip category entries like "Junghunde (5)", "Große Hunde (11)"
        if (/\(\d+\)$/.test(rawTitle)) continue;
        if (name.length > 80) continue;
        seen.add(name);

        const statusText = parts.slice(1).join(' ').toLowerCase();
        let status = 'available';
        if (statusText.includes('reserviert'))                                          status = 'reserved';
        else if (statusText.includes('paten') || statusText.includes('nicht zu vermitteln')) status = 'sponsor';

        dogs.push({
          id: stableId('tsv-giessen', name),
          name,
          slug: slugify(name),
          shelter: 'TSV Gießen',
          shelterCity: 'Gießen (TSV)',
          shelterPhone: '0641 52251',
          shelterEmail: 'info@tsv-giessen.de',
          shelterUrl: SHELTER_URL,
          profileUrl,
          image: imageUrl || null,
          images: imageUrl ? [imageUrl] : [],
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
