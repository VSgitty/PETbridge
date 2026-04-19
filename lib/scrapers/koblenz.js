/**
 * Tierheim Koblenz scraper.
 *
 * TYPO3-based CMS. Dogs are listed under the section heading
 * "Diese Hunde suchen ein neues Zuhause" as ### headings, each followed
 * by a breed line, gender/castration, birth date, an optional note, a
 * [Details](url) link, and then the dog's photo as ![Image N](url).
 *
 * Example structure (after Jina renders it):
 *   ### Blue - Miss Volldampf
 *   * * *
 *   Dt.Schäferhund
 *   Hund, kastriert
 *   geb. 31.01.2020
 *   HD & ED frei / Als gefährlich eingestuft
 *   [Details](https://www.tierheim-koblenz.de/unsere-tiere/hunde/detailansicht?...)
 *   ![Image 34](https://www.tierheim-koblenz.de/fileadmin/_processed_/...)
 */
import { slugify, stableId, cleanupMarkdown, uniqueStrings, deriveAgeLabel } from '../utils.js';

const JINA_BASE   = 'https://r.jina.ai/';
const LISTING_URL = 'https://www.tierheim-koblenz.de/unsere-tiere/hunde';
const SHELTER_URL = 'https://www.tierheim-koblenz.de';

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

const SKIP_NAMES = ['unsere hunde', 'hundepaten', 'diese hunde', 'paten'];

export async function scrapeKoblenz() {
  try {
    const markdown = await fetchWithJina(LISTING_URL);
    const cleaned  = cleanupMarkdown(markdown);

    // Isolate the dog-listing section
    const sectionStart = cleaned.search(/##\s+Diese Hunde suchen/i);
    const sectionEnd   = cleaned.search(/##\s+Unsere Hunde[pP]aten/i);
    const content = cleaned.slice(
      sectionStart > 0 ? sectionStart : 0,
      sectionEnd   > 0 ? sectionEnd   : cleaned.length,
    );

    const dogs = [];
    const seen = new Set();

    // Split on ### headings (individual dog entries)
    const sections = content.split(/\n(?=###\s+[^\s#])/);

    for (const section of sections) {
      const lines = section.split('\n').map(l => l.trim()).filter(Boolean);
      if (!lines.length) continue;

      const headingMatch = lines[0].match(/^###\s+(.+)$/);
      if (!headingMatch) continue;
      const name = headingMatch[1].trim();
      if (!name || seen.has(name)) continue;
      if (SKIP_NAMES.some(s => name.toLowerCase().includes(s))) continue;
      seen.add(name);

      // Extract dog photo (![Image N](url)) – comes after [Details] link
      const images = uniqueStrings(
        [...section.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/g)].map(m => m[1])
      );

      // Extract the Details profile URL
      const detailsMatch = section.match(/\[Details\]\((https?:\/\/[^)]+)\)/i);
      const profileUrl   = detailsMatch ? detailsMatch[1] : LISTING_URL;

      // Parse breed, sex, birth date, and note from the body lines
      let breed         = '';
      let sex           = '';
      let neuteredStatus = '';
      let birthText     = '';
      let note          = '';
      const reserved    = /\bReserviert\b/i.test(section);

      for (const line of lines.slice(1)) {
        // Strip markdown decorations (* horizontal rules, links, images)
        const stripped = line
          .replace(/\*+/g, '')
          .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
          .replace(/\[[^\]]*\]\([^)]*\)/g, '')
          .trim();
        if (!stripped) continue;

        // Breed: first meaningful non-keyword line
        if (!breed && !/^(Hund|Hündin|geb\.|Vermittlung|Keine|Reserviert|Paten)/i.test(stripped)) {
          breed = stripped;
          continue;
        }
        // Sex + castration
        if (!sex && /\b(Hund|Hündin)\b/i.test(stripped)) {
          sex            = /Hündin/i.test(stripped) ? 'weiblich' : 'männlich';
          neuteredStatus = /kastriert/i.test(stripped) ? 'kastriert' : '';
          continue;
        }
        // Birth date
        if (!birthText && /geb\./i.test(stripped)) {
          birthText = stripped.replace(/^geb\.\s*/i, '').trim();
          continue;
        }
        // Remaining non-link lines → note (max one)
        if (!note && stripped.length > 8 && !/^(Reserviert|Paten|Details)/i.test(stripped)) {
          note = stripped;
        }
      }

      dogs.push({
        id: stableId('koblenz', name),
        name,
        slug: slugify(name),
        shelter: 'Tierheim Koblenz',
        shelterCity: 'Koblenz',
        shelterPhone: '0261/40638-0',
        shelterEmail: 'info@tierheim-koblenz.de',
        shelterUrl: SHELTER_URL,
        profileUrl,
        image: images[0]  || null,
        images: uniqueStrings(images),
        breed,
        birthText,
        ageLabel: deriveAgeLabel(birthText),
        sex,
        neuteredStatus,
        size: '',
        weight: '',
        color: '',
        since: '',
        description: note,
        status: reserved ? 'reserved' : 'available',
        scrapedAt: new Date().toISOString(),
      });
    }

    console.log(`[Koblenz] ${dogs.length} dogs parsed`);
    return dogs;
  } catch (err) {
    console.error('[Koblenz] Scraper error:', err.message);
    return [];
  }
}
