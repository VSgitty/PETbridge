/**
 * Tierheim Gelnhausen scraper.
 * Listing page: WordPress with #### [Name](url) entries.
 * Gets listing data; individual pages fetched on demand via detail API.
 */
import { slugify, stableId, cleanupMarkdown, uniqueStrings, deriveAgeLabel } from '../utils.js';

const JINA_BASE = 'https://r.jina.ai/';
const LISTING_URL = 'https://tierheim-gelnhausen.org/hunde/';

async function fetchWithJina(url) {
  const res = await fetch(`${JINA_BASE}${url}`, {
    headers: { 'User-Agent': 'PetBridge/1.0', Accept: 'text/markdown' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function parseListing(markdown) {
  const cleaned = cleanupMarkdown(markdown);
  const dogs = [];

  // Dog entries appear as: #### [Name](url) or ## [Name](url)
  // followed by date line and description
  const DOG_RE = /#{2,4}\s+\[([^\]]+)\]\((https:\/\/tierheim-gelnhausen\.org\/[^)]+)\)\s*\n+((?:\d+\.\s+\w+\s+\d{4})?)\n*([\s\S]*?)(?=\n#{2,4}\s+\[|$)/g;

  let m;
  while ((m = DOG_RE.exec(cleaned)) !== null) {
    const rawName = m[1].trim();
    const url = m[2].trim();
    const dateText = (m[3] || '').trim();
    const rest = (m[4] || '');

    if (!rawName || rawName.length > 80) continue;
    // Skip section headings that aren't dog names
    if (/^(Übersicht|Hunde|Filtern|Vorneweg|Traumhund|Angaben|Wichtig|Was bedeutet)/i.test(rawName)) continue;

    // Extract image URLs from surrounding context
    const contextStart = Math.max(0, m.index - 300);
    const context = cleaned.slice(contextStart, m.index + 300);
    const imgs = uniqueStrings(
      [...context.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)]+(?:jpg|jpeg|png|webp)[^)]*)\)/gi)].map(x => x[1])
    );

    const isReserved = rawName.toLowerCase().includes('reserviert');
    const isBlocked  = rawName.toLowerCase().includes('geblockt');

    // First non-empty, non-image line of description
    const descLine = rest
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[[^\]]*\]\([^)]*\)/g, '')
      .split('\n')
      .map(l => l.trim())
      .find(l => l.length > 10) || '';

    const cleanName = rawName
      .replace(/\*?(RESERVIERT|GEBLOCKT)\*?/gi, '')
      .replace(/\s*–\s*externe Vermittlung/gi, '')
      .replace(/\s+auf Pflegestelle/gi, '')
      .trim();

    dogs.push({
      id: stableId('gelnhausen', cleanName),
      name: cleanName,
      slug: slugify(cleanName),
      shelter: 'Tierheim Gelnhausen',
      shelterCity: 'Gelnhausen',
      shelterPhone: '06051/2550',
      shelterEmail: 'webmaster@tierheim-gelnhausen.de',
      shelterUrl: 'https://tierheim-gelnhausen.org',
      profileUrl: url,
      image: imgs[0] || null,
      images: imgs,
      breed: '',
      birthText: '',
      ageLabel: '',
      sex: '',
      neuteredStatus: '',
      size: '',
      description: descLine,
      postedDate: dateText,
      status: isReserved ? 'reserved' : isBlocked ? 'blocked' : 'available',
      scrapedAt: new Date().toISOString(),
    });
  }

  return dogs;
}

/**
 * Fetch and parse a single Gelnhausen dog profile page.
 * Called from the detail API route on demand.
 */
export async function fetchGelnhausenDetail(profileUrl) {
  try {
    const raw = await fetchWithJina(profileUrl);
    const cleaned = cleanupMarkdown(raw);

    const images = uniqueStrings(
      [...cleaned.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)]+(?:jpg|jpeg|png|webp)[^)]*)\)/gi)].map(m => m[1])
    );

    // Extract key facts from markdown text
    const info = {};
    for (const line of cleaned.split('\n')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0 && colonIdx < 30) {
        const key = line.slice(0, colonIdx).trim().toLowerCase();
        const val = line.slice(colonIdx + 1).trim();
        if (val) info[key] = val;
      }
    }

    // Description: collect longer text paragraphs
    const descParts = cleaned
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 60 && !l.startsWith('!') && !l.startsWith('[') && !l.startsWith('#'));

    return {
      images,
      breed: info['rasse'] || info['race'] || '',
      birthText: info['geboren'] || info['geburtsdatum'] || '',
      ageLabel: deriveAgeLabel(info['geboren'] || ''),
      sex: info['geschlecht'] || '',
      neuteredStatus: (info['geschlecht'] || '').includes('kastriert') ? 'kastriert' : '',
      size: info['größe'] || info['grosse'] || '',
      weight: info['gewicht'] || '',
      color: info['farbe'] || '',
      since: info['im tierheim seit'] || '',
      description: descParts.slice(0, 4).join('\n\n'),
    };
  } catch (err) {
    console.error('[Gelnhausen] Detail fetch error:', err.message);
    return null;
  }
}

export async function scrapeGelnhausen() {
  try {
    const markdown = await fetchWithJina(LISTING_URL);
    const dogs = parseListing(markdown);
    console.log(`[Gelnhausen] ${dogs.length} dogs parsed`);
    return dogs;
  } catch (err) {
    console.error('[Gelnhausen] Scraper error:', err.message);
    return [];
  }
}
