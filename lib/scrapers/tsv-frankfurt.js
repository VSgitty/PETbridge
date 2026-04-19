/**
 * Tierschutzverein Frankfurt e.V. scraper.
 *
 * The TSV Frankfurt website (tsv-frankfurt.de) is a frameset that points to
 * a Comedius CMS hosted on presenter.comedius.de. Dogs are split across 6
 * separate category listing pages, each paginated (5 or 10 per page).
 *
 * Listing page entry format (after Jina renders it):
 *   ![Image N](https://presenter.comedius.de/pic/.../file_...)
 *   Erstellt am: DD.MM.YYYY**NAME** Breed Sex Castration Geb. DATE
 *   [**weitere Informationen...**](detailUrl)
 *
 * Data is extracted directly from the listing (no need to visit detail pages).
 */
import { slugify, stableId, cleanupMarkdown, deriveAgeLabel } from '../utils.js';

const JINA_BASE   = 'https://r.jina.ai/';
const SHELTER_URL = 'https://www.tsv-frankfurt.de';
const PHP = 'https://presenter.comedius.de/design/tsv_frankfurt_standard_10001.php';

// Two mandant tokens – some categories use a version ending in '2'
const M  = 'tsv_ffm_f8bc3055161419854ea9ddb99936b98e';
const M2 = 'tsv_ffm_f8bc3055161419854ea9ddb99936b98e2';

const CATEGORIES = [
  { label: 'Kleine Hunde',   bereich: 'Kleine_Hunde',   mandant: M  },
  { label: 'Mittlere Hunde', bereich: 'Mittlere_Hunde', mandant: M  },
  { label: 'Große Hunde',    bereich: 'Gro%DFe_Hunde',  mandant: M  },
  { label: 'Notfälle',       bereich: 'Notf%E4lle',     mandant: M  },
  { label: 'Welpen',         bereich: 'Welpen',          mandant: M2 },
  { label: 'Birkenhof',      bereich: 'Hunde',           mandant: M  },
];

function listingBaseUrl(mandant, bereich) {
  return `${PHP}?f_mandant=${mandant}&f_bereich=${bereich}&f_funktion=Uebersicht`;
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

/**
 * Extract all paginated listing-page URLs from the Comedius pagination bar.
 * The bar looks like: [**1**](url1)[2](url2)[3](url3)
 * We only return pages 2+ (page 1 is already fetched).
 */
function extractPaginationUrls(text) {
  const urls = new Set();
  const re = /\]\((https?:\/\/presenter\.comedius\.de\/design\/[^)]+f_aktuelle_seite=(\d+)[^)]+f_funktion=Uebersicht[^)]*)\)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (parseInt(m[2], 10) > 1) urls.add(m[1]);
  }
  return [...urls];
}

/**
 * Parse all dog entries from a Comedius listing page markdown.
 *
 * Each entry matches:
 *   ![Image N](<picUrl>) ... Erstellt am: DATE **NAME** info ... [**weitere Info...**](<detailUrl>)
 */
function parseComediusPage(text) {
  const dogs = [];

  // Match image URL + everything up to [**weitere Informationen...](<detailUrl>)
  const entryRe = /!\[Image \d+\]\((https?:\/\/presenter\.comedius\.de\/pic\/[^)]+)\)[\s\S]*?Erstellt am:\s*[\d./]+\s*([\s\S]*?)\[[\s\S]*?weitere Informationen[\s\S]*?\]\((https?:\/\/[^)]+)\)/g;

  let m;
  while ((m = entryRe.exec(text)) !== null) {
    const imageUrl     = m[1];
    const entryContent = m[2]; // "**NAME...** Breed Sex Cast Geb. DATE "
    const profileUrl   = m[3];

    // ── Name ──────────────────────────────────────────────────────────────
    // Use [^*]+ (stops at first asterisk) to grab the core name even when
    // the entry has embedded bold notes like "**KIMBO ***LEBT AUF DEM BIRKENHOF*****"
    const nameMatch = entryContent.match(/\*\*([^*]+)/);
    if (!nameMatch) continue;

    let rawName = nameMatch[1].trim();
    // "HAIKO - dringend erfahrene Malinois-Liebhaber gesucht" → "HAIKO"
    const dashIdx = rawName.indexOf(' - ');
    let name = (dashIdx > 0 && dashIdx < 35) ? rawName.slice(0, dashIdx).trim() : rawName;
    name = name.replace(/\*+/g, '').trim().slice(0, 55);
    if (!name || name.length < 2) continue;

    // ── Clean info text ───────────────────────────────────────────────────
    const info = entryContent
      .replace(/\*+/g, ' ')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const lc = info.toLowerCase();

    // ── Sex ───────────────────────────────────────────────────────────────
    const sex = /\b(weiblich|hündin)\b/.test(lc) ? 'weiblich'
      : /\b(männlich|rüde)\b/.test(lc) ? 'männlich'
      : '';

    // ── Castration ────────────────────────────────────────────────────────
    const neuteredStatus = /nicht\s+kastriert|kastration:\s*nein|kastriert:\s*nein/.test(lc)
      ? 'nicht kastriert'
      : /\bkastriert\b|kastration:\s*ja/.test(lc)
      ? 'kastriert'
      : '';

    // ── Birth date ────────────────────────────────────────────────────────
    const gebMatch = info.match(/Geb[.:]?\s*([\S][\S ]{0,25}?)(?:\s+[A-ZÄÖÜ](?!eb)|\s*$)/i);
    const birthText = (gebMatch?.[1] || '').replace(/\s+/g, ' ').trim().slice(0, 30);

    // ── Breed: text before the sex/Geschlecht keyword ─────────────────────
    const sexPos = info.search(/\b(Männlich|Weiblich|männlich|weiblich|Geschlecht)\b/i);
    let breed = '';
    if (sexPos > 0) {
      // breed is after the name, before the sex keyword
      const nameEnd = info.indexOf(name) + name.length;
      const rawBreed = info.slice(nameEnd, sexPos).trim();
      // Remove leading "Erstellt am:..." fragments
      breed = rawBreed.replace(/^Erstellt am:[\s\S]*?\d{4}\s*/i, '').trim().slice(0, 50);
    }

    // ── Status ────────────────────────────────────────────────────────────
    const status = /RESERVIERT/i.test(entryContent) ? 'reserved' : 'available';

    dogs.push({
      id: stableId('tsv-frankfurt', name),
      name,
      slug: slugify(name),
      shelter: 'Tierschutzverein Frankfurt e.V.',
      shelterCity: 'Frankfurt',
      shelterPhone: '069 / 42 30 05',
      shelterEmail: 'vermittlung-hunde@tsv-frankfurt.de',
      shelterUrl: SHELTER_URL,
      profileUrl,
      image: imageUrl,
      images: [imageUrl],
      breed,
      birthText,
      ageLabel: deriveAgeLabel(birthText),
      sex,
      neuteredStatus,
      size: '',
      weight: '',
      color: '',
      since: '',
      description: '',
      status,
      scrapedAt: new Date().toISOString(),
    });
  }

  return dogs;
}

export async function scrapeTsvFrankfurt() {
  try {
    const seen  = new Set();
    const dogs  = [];

    // ── Step 1: fetch all 6 category page-1s in parallel ─────────────────
    const catResults = await Promise.allSettled(
      CATEGORIES.map(cat =>
        fetchWithJina(listingBaseUrl(cat.mandant, cat.bereich))
          .then(text => ({ text, cat }))
      )
    );

    // ── Step 2: for each successful category, queue extra pages ───────────
    const extraPromises = [];

    for (const result of catResults) {
      if (result.status !== 'fulfilled') continue;
      const { text, cat } = result.value;

      // Parse page 1 dogs
      for (const dog of parseComediusPage(text)) {
        if (!seen.has(dog.name)) { seen.add(dog.name); dogs.push(dog); }
      }

      // Collect pagination URLs (pages 2+) and schedule fetches
      for (const url of extractPaginationUrls(text)) {
        extraPromises.push(
          fetchWithJina(url).then(t => ({ text: t, cat }))
        );
      }
    }

    // ── Step 3: fetch remaining pages (pages 2, 3…) ───────────────────────
    const extraResults = await Promise.allSettled(extraPromises);

    for (const result of extraResults) {
      if (result.status !== 'fulfilled') continue;
      const { text } = result.value;
      for (const dog of parseComediusPage(text)) {
        if (!seen.has(dog.name)) { seen.add(dog.name); dogs.push(dog); }
      }
    }

    console.log(`[TSV Frankfurt] ${dogs.length} dogs parsed`);
    return dogs;
  } catch (err) {
    console.error('[TSV Frankfurt] Scraper error:', err.message);
    return [];
  }
}
