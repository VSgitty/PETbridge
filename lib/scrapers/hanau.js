/**
 * Tierschutz Hanau scraper.
 * All dogs listed on one page. Format via Jina:
 *   # DogName
 *   Rasse: ...
 *   Geboren: ...
 *   Geschlecht: ...
 *   Größe: ... cm
 *   Gewicht: ...
 *   Im Tierheim seit: ...
 *   [description text]
 */
import { slugify, stableId, cleanupMarkdown, uniqueStrings, deriveAgeLabel, deriveSizeLabel } from '../utils.js';

const JINA_BASE = 'https://r.jina.ai/';
const LISTING_URL = 'https://www.tierschutz-hanau.de/tiere/hunde-tierheim.html';

const SKIP_HEADINGS = [
  'allgemeine informationen', 'wir suchen', 'an zwei', 'das hat', 'diese hunde',
  'übernahme', 'impressum', 'kontakt', 'datenschutz', 'lieber führerschein',
  'tierheim hanau', 'hunde', 'header', 'navigation', 'footer', 'aktuelles',
  'startseite', 'suche', 'sitemap', 'pate werden', 'tiere', 'gassigeher',
];

async function fetchWithJina(url) {
  const res = await fetch(`${JINA_BASE}${url}`, {
    headers: { 'User-Agent': 'PetBridge/1.0', Accept: 'text/markdown' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function shouldSkip(name) {
  const lc = name.toLowerCase();
  return (
    name.length > 60 ||
    SKIP_HEADINGS.some(s => lc.includes(s)) ||
    /^\d/.test(name) ||        // starts with number
    name.includes('©') ||
    name.includes('http')
  );
}

function parseHanauMarkdown(markdown) {
  const cleaned = cleanupMarkdown(markdown);

  // Cut at footer/nav section
  const footerIdx = cleaned.search(/\n#{1,3}\s+(Übernahme|Impressum|Kontakt|Navigation|Datenschutz)/i);
  const content = footerIdx > 0 ? cleaned.slice(0, footerIdx) : cleaned;

  const dogs = [];

  // Split by headings (# Name or ## Name)
  const sections = content.split(/\n(?=#{1,3}\s+[^\s#])/);

  for (const section of sections) {
    const lines = section.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    // Extract name from heading
    const headingMatch = lines[0].match(/^#{1,3}\s+(.+)$/);
    if (!headingMatch) continue;
    const name = headingMatch[1].trim();
    if (shouldSkip(name)) continue;

    const info = {};
    const descParts = [];
    const images = [];

    for (const line of lines.slice(1)) {
      // Images
      const imgMatch = line.match(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/);
      if (imgMatch) {
        let imgUrl = imgMatch[1];
        if (!imgUrl.startsWith('http')) imgUrl = 'https://www.tierschutz-hanau.de' + imgUrl;
        images.push(imgUrl);
        continue;
      }
      // Strip inline links
      const stripped = line.replace(/\[[^\]]*\]\([^)]*\)/g, '').trim();
      if (!stripped) continue;

      // Key: value pairs (Rasse:, Geboren:, etc.)
      const colonIdx = stripped.indexOf(':');
      if (colonIdx > 0 && colonIdx < 35) {
        const key = stripped.slice(0, colonIdx).trim().toLowerCase();
        const val = stripped.slice(colonIdx + 1).trim();
        if (val) info[key] = val;
      } else if (stripped.length > 40) {
        descParts.push(stripped);
      }
    }

    // A valid dog entry must have at least rasse or geboren
    if (!info['rasse'] && !info['geboren'] && !info['geschlecht']) continue;

    const geschlecht = info['geschlecht'] || '';
    const groesse = info['größe'] || info['grosse'] || info['größe:'] || '';

    dogs.push({
      id: stableId('hanau', name),
      name,
      slug: slugify(name),
      shelter: 'Tierschutz Hanau',
      shelterCity: 'Hanau',
      shelterPhone: '06181 - 45116',
      shelterEmail: 'kontakt@tierheim-hanau.de',
      shelterUrl: 'https://www.tierschutz-hanau.de',
      profileUrl: LISTING_URL,
      image: images[0] || null,
      images: uniqueStrings(images),
      breed: info['rasse'] || '',
      birthText: info['geboren'] || '',
      ageLabel: deriveAgeLabel(info['geboren'] || ''),
      sex: geschlecht.toLowerCase().includes('weiblich') ? 'weiblich' : geschlecht ? 'männlich' : '',
      neuteredStatus: geschlecht.toLowerCase().includes('kastriert') ? 'kastriert' : '',
      size: deriveSizeLabel(groesse) || groesse,
      weight: info['gewicht'] || '',
      color: info['farbe'] || '',
      since: info['im tierheim seit'] || '',
      description: descParts.slice(0, 3).join('\n\n').slice(0, 800),
      status: 'available',
      scrapedAt: new Date().toISOString(),
    });
  }

  return dogs;
}

export async function scrapeHanau() {
  try {
    const markdown = await fetchWithJina(LISTING_URL);
    const dogs = parseHanauMarkdown(markdown);
    console.log(`[Hanau] ${dogs.length} dogs parsed`);
    return dogs;
  } catch (err) {
    console.error('[Hanau] Scraper error:', err.message);
    return [];
  }
}
