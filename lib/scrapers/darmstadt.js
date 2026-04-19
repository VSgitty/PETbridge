/**
 * TSV Darmstadt dog scraper.
 *
 * Wix-based site. Each dog appears as:
 *   [![Image N: Name](imgUrl)](https://www.tsv-darmstadt.de/tsv-tiere/name/uuid)
 *   #### Name
 *   Männlich / Weiblich
 *   Birth year / date
 *   Breed
 */
import { slugify, stableId, cleanupMarkdown, uniqueStrings, deriveAgeLabel } from '../utils.js';

const JINA_BASE = 'https://r.jina.ai/';
const LISTING_URL = 'https://www.tsv-darmstadt.de/hunde';

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

export async function scrapeDarmstadt() {
  try {
    const markdown = await fetchWithJina(LISTING_URL);
    const cleaned = cleanupMarkdown(markdown);

    // Find the main dog-listing section
    const sectionStart = cleaned.search(/# Lauter tolle/i);
    const sectionEnd   = cleaned.search(/\n###\s+Der Vermittlungsprozess/i);
    const content = cleaned.slice(
      sectionStart > 0 ? sectionStart : 0,
      sectionEnd   > 0 ? sectionEnd   : cleaned.length,
    );

    const dogs = [];
    const seen = new Set();

    // Pattern: [![Image N: Name](imgUrl)](profileUrl)  then  #### Name  then sex  then year  then breed
    // cleanupMarkdown collapses 3+ newlines → 2, so blocks are separated by \n\n or \n
    const dogPattern = /\[!\[Image \d+[^\]]*\]\(([^)]+)\)\]\(([^)\s]+)[^)]*\)\s*\n+####\s+([^\n]+)\s*\n+(M[äa]nnlich|Weiblich)\s*\n+([^\n]+)\s*\n+([^\n]+)/gi;

    let m;
    while ((m = dogPattern.exec(content)) !== null) {
      const [, imageUrl, profileUrl, name, sexRaw, yearRaw, breedRaw] = m;
      const cleanName = name.trim();
      if (!cleanName || seen.has(cleanName)) continue;
      // Skip non-dog headings
      if (/^(Hunde|Tiere|Verein|Kontakt|Projekte|Tierheim|Helfen|Aktuell|Shop|Impressum|Datenschutz)/i.test(cleanName)) continue;
      seen.add(cleanName);

      const sex = /weiblich/i.test(sexRaw) ? 'weiblich' : 'männlich';
      // Remove zero-width spaces and trim
      const birthText = yearRaw.replace(/\u200b/g, '').trim();
      const breed     = breedRaw.replace(/\u200b/g, '').trim();

      dogs.push({
        id: stableId('darmstadt', cleanName),
        name: cleanName,
        slug: slugify(cleanName),
        shelter: 'TSV Darmstadt',
        shelterCity: 'Darmstadt',
        shelterPhone: '06151/891470',
        shelterEmail: 'info@tsv-darmstadt.de',
        shelterUrl: 'https://www.tsv-darmstadt.de',
        profileUrl: profileUrl.trim(),
        image: imageUrl.trim(),
        images: [imageUrl.trim()],
        breed,
        birthText,
        ageLabel: deriveAgeLabel(birthText),
        sex,
        neuteredStatus: '',
        size: '',
        weight: '',
        color: '',
        since: '',
        description: '',
        status: 'available',
        scrapedAt: new Date().toISOString(),
      });
    }

    console.log(`[Darmstadt] ${dogs.length} dogs parsed`);
    return dogs;
  } catch (err) {
    console.error('[Darmstadt] Scraper error:', err.message);
    return [];
  }
}
