/**
 * Generic Discovery Scraper.
 *
 * For shelter websites that have NO single listing page with all dogs.
 * Instead of being given a URL that lists all dogs, the scraper:
 *
 *  1. Fetches the given start URL
 *  2. Collects all internal links from the page
 *  3. Scores each link by URL pattern (dog-related keywords = higher score)
 *  4. Fetches the top-scored candidates (max 20 pages)
 *  5. Validates each page / section with a strict heuristic:
 *
 *     A page section is a DOG ENTRY if and only if it contains BOTH:
 *       • A sex indicator  → "männlich", "weiblich", "rüde", "hündin"
 *       • A castration indicator → "kastriert", "kastration"
 *         OR an explicit breed label → "Rasse:"
 *
 *  6. Extracts dog data from every validated entry
 *  7. Returns deduplicated dogs
 *
 * To use: set scraper: 'discover' in shelterConfig.js for any shelter
 * where the standard generic scraper cannot find a clean listing page.
 */
import { slugify, stableId, cleanupMarkdown, deriveAgeLabel } from '../utils.js';

const JINA_BASE = 'https://r.jina.ai/';
const MAX_PAGES  = 20;  // max pages to crawl per shelter beyond start
const BATCH_SIZE = 5;   // concurrent Jina requests

// URL fragments that almost certainly point to non-dog pages
const EXCLUDE_URL_RE = /impressum|datenschutz|cookie|kontakt|newsletter|spenden|agb|download|\.pdf|galerie|fotos|presse|news|aktuell|blog|team|verein|über-uns|about-us|mitglied|anfahrt|öffnungszeit|facebook\.com|instagram\.com|youtube\.com|twitter\.com|linkedin\.com/i;

// ── Network ───────────────────────────────────────────────────────────────────

async function fetchWithJina(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
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

// ── Link discovery ────────────────────────────────────────────────────────────

function extractInternalLinks(markdown, startUrl) {
  let baseHostname;
  try { baseHostname = new URL(startUrl).hostname; } catch { return []; }

  const links = new Set();
  const re = /\]\((https?:\/\/[^)\s"]+)\)/g;
  let m;
  while ((m = re.exec(markdown)) !== null) {
    try {
      const url = new URL(m[1].split('#')[0]);
      if (url.hostname === baseHostname && !EXCLUDE_URL_RE.test(url.href)) {
        links.add(url.href);
      }
    } catch { /* invalid URL – skip */ }
  }
  return [...links];
}

/**
 * Score a URL for likelihood of containing dog-adoption content.
 * Higher = more likely to be a dog page.
 */
function scoreUrl(url) {
  const lc = url.toLowerCase();
  let score = 0;
  if (/\bhund(e)?\b|hunde-/.test(lc))              score += 4;
  if (/\btier(?!schutz|heim|arzt)\b/.test(lc))     score += 2;
  if (/vermittl|adopt|profil|detail/.test(lc))      score += 3;
  if (/paged?=\d|seite=\d|page=\d/.test(lc))       score += 2; // pagination
  if (/kategori|category|product_cat/.test(lc))     score += 1;
  return score;
}

// ── Validation heuristic ──────────────────────────────────────────────────────

/**
 * Returns true when a text block is DEFINITELY a dog-adoption entry.
 *
 * Requires ALL of:
 *  1. A sex keyword  (männlich / weiblich / rüde / hündin)
 *  2. A castration keyword OR explicit breed label
 *
 * This combination virtually never appears in non-dog content
 * (news articles, team pages, contact info, etc.).
 */
function isDogEntry(text) {
  const hasSex        = /\b(männlich|weiblich|rüde|hündin)\b/i.test(text);
  const hasCastration = /\b(kastriert|kastration)\b/i.test(text);
  const hasBreedLabel = /\brasse\s*:/i.test(text);
  return hasSex && (hasCastration || hasBreedLabel);
}

// ── Extraction ────────────────────────────────────────────────────────────────

function buildDogObject(name, section, profileUrl, shelter) {
  // Image
  const imgMatch  = section.match(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/);
  const imageUrl  = imgMatch?.[1] || null;

  const lc = section.toLowerCase();

  // Sex
  const sex = /\b(weiblich|hündin)\b/.test(lc) ? 'weiblich'
    : /\b(männlich|rüde)\b/.test(lc) ? 'männlich'
    : '';

  // Castration
  const neuteredStatus = /nicht\s+kastriert|kastration:\s*nein|kastriert:\s*nein/.test(lc)
    ? 'nicht kastriert'
    : /\bkastriert\b|kastration:\s*ja/.test(lc)
    ? 'kastriert'
    : '';

  // Breed
  const breedMatch = section.match(/Rasse\s*:\s*([^\n*,]{2,40})/i);
  const breed = breedMatch?.[1]?.trim() || '';

  // Birth
  const gebMatch = section.match(/(?:Geb(?:oren)?\.?|geboren)\s*:?\s*([\S]{2,25})/i);
  const birthText = gebMatch?.[1]?.trim() || '';

  // Status
  const status = /reserviert/i.test(section)           ? 'reserved'
    : /paten?\s*gesucht|patenhund/i.test(section)      ? 'sponsor'
    : 'available';

  // Description: first paragraph not containing purely metadata
  const descMatch = section.match(/(?:\n\n|\n)((?:[^#\n][^\n]{20,}[\n]?){1,3})/);
  const description = (descMatch?.[1] || '').replace(/\s+/g, ' ').trim().slice(0, 500);

  return {
    id: stableId(shelter.id, name),
    name,
    slug: slugify(name),
    shelter: shelter.name,
    shelterCity: shelter.city,
    shelterPhone: shelter.phone || '',
    shelterEmail: shelter.email || '',
    shelterUrl: shelter.shelterUrl,
    profileUrl: profileUrl || shelter.url,
    image: imageUrl,
    images: imageUrl ? [imageUrl] : [],
    breed,
    birthText,
    ageLabel: deriveAgeLabel(birthText),
    sex,
    neuteredStatus,
    size: '',
    weight: '',
    color: '',
    since: '',
    description,
    status,
    scrapedAt: new Date().toISOString(),
  };
}

/**
 * Extract all valid dog entries from a single Jina-rendered markdown page.
 *
 * Tries two splitting strategies:
 *  A) Heading-based sections  (## DogName … metadata)
 *  B) Comedius-style blocks   (Erstellt am: DATE **NAME** … [weitere…](url))
 */
function extractDogsFromPage(markdown, pageUrl, shelter) {
  const cleaned = cleanupMarkdown(markdown);
  const dogs    = [];

  // ── Strategy A: heading-split (most WP/Wix/Jimdo sites) ─────────────────
  const sections = cleaned.split(/\n(?=#{1,4}\s+[^\s#])/);

  for (const section of sections) {
    if (!isDogEntry(section)) continue;

    const headingMatch = section.match(/^#{1,4}\s+(.{2,60})$/m);
    if (!headingMatch) continue;

    let name = headingMatch[1]
      .replace(/\[[^\]]*\]\([^)]*\)/g, '')  // strip link syntax
      .replace(/[*_`]/g, '')                 // strip markdown
      .split(' – ')[0]                       // strip status suffix e.g. "– reserviert"
      .trim();
    if (!name || name.length < 2 || name.length > 60) continue;

    // Skip site-structure headings
    if (/^(Impressum|Datenschutz|Kontakt|Navigation|Header|Footer|Suche|Team|Verein|Über\s|Home|Aktuell|News|Galerie|Spenden)/i.test(name)) continue;

    const linkMatch = section.match(/\[(?:[^\]]*)\]\((https?:\/\/[^)]+)\)/);
    const profileUrl = linkMatch?.[2] || pageUrl;

    dogs.push(buildDogObject(name, section, profileUrl, shelter));
  }

  // ── Strategy B: Comedius "Erstellt am:" blocks ──────────────────────────
  //    (also helps for any site that shows structured dog cards inline)
  if (/Erstellt am:/i.test(cleaned)) {
    const parts = cleaned.split(/(?=Erstellt am:)/i);

    for (const part of parts) {
      if (!part.startsWith('Erstellt am:') && !part.startsWith('erstellt am:')) continue;
      if (!isDogEntry(part)) continue;

      const boldMatch = part.match(/\*\*([^*]+)/);
      if (!boldMatch) continue;

      let rawName = boldMatch[1].trim();
      const dashIdx = rawName.indexOf(' - ');
      let name = (dashIdx > 0 && dashIdx < 35) ? rawName.slice(0, dashIdx).trim() : rawName;
      name = name.replace(/\*+/g, '').trim().slice(0, 55);
      if (!name || name.length < 2) continue;

      const detailMatch = part.match(/weitere Informationen[\s*]*\]\((https?:\/\/[^)]+)\)/i);
      const profileUrl  = detailMatch?.[1] || pageUrl;

      dogs.push(buildDogObject(name, part, profileUrl, shelter));
    }
  }

  return dogs;
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function scrapeWithDiscovery(shelter) {
  const { url: startUrl } = shelter;
  const visited   = new Set([startUrl]);
  const seenNames = new Set();
  const allDogs   = [];

  function addDogs(dogs) {
    for (const dog of dogs) {
      const key = dog.name.toLowerCase();
      if (key && !seenNames.has(key)) {
        seenNames.add(key);
        allDogs.push(dog);
      }
    }
  }

  try {
    // ── Fetch start URL ────────────────────────────────────────────────────
    const startMarkdown = await fetchWithJina(startUrl);
    addDogs(extractDogsFromPage(startMarkdown, startUrl, shelter));

    // ── Score and rank internal links ──────────────────────────────────────
    const candidates = extractInternalLinks(startMarkdown, startUrl)
      .filter(url => !visited.has(url))
      .map(url => ({ url, score: scoreUrl(url) }))
      .filter(({ score }) => score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_PAGES)
      .map(({ url }) => url);

    // ── Fetch candidates in batches of BATCH_SIZE ──────────────────────────
    for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
      const batch = candidates.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(url => {
          visited.add(url);
          return fetchWithJina(url).then(md => ({ md, url }));
        })
      );

      for (const res of results) {
        if (res.status !== 'fulfilled') continue;
        const { md, url } = res.value;
        addDogs(extractDogsFromPage(md, url, shelter));
      }
    }

    console.log(`[${shelter.name}] Discovery: ${allDogs.length} dogs across ${visited.size} pages`);
    return allDogs;
  } catch (err) {
    console.error(`[${shelter.name}] Discovery error:`, err.message);
    return [];
  }
}
