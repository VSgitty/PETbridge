/**
 * Tierschutz Hanau scraper.
 *
 * The Hanau website uses inline bold key-value pairs on the same line:
 *   **Rasse:** AmStaff-Terrier **Farbe:** Braun **Geboren:** 05/2018
 *   **Geschlecht:** männlich – kastriert **Größe:** 49 cm **Gewicht:** 30,4 kg
 *   **Im Tierheim seit:** 02.05.2025
 *
 * Dog profiles appear as `# Name` H1 headings. We join all section lines, split
 * by `**` to reliably extract each key-value pair, then recover the description
 * from what follows the last metadata entry.
 */
import { slugify, stableId, cleanupMarkdown, uniqueStrings, deriveAgeLabel, deriveSizeLabel } from '../utils.js';

const JINA_BASE = 'https://r.jina.ai/';
const LISTING_URL = 'https://www.tierschutz-hanau.de/tiere/hunde-tierheim.html';

const SKIP_HEADINGS = [
  'allgemeine informationen', 'wir suchen', 'an zwei', 'das hat', 'diese hunde',
  'übernahme', 'impressum', 'kontakt', 'datenschutz', 'lieber führerschein',
  'tierheim hanau', 'header', 'navigation', 'footer', 'aktuelles',
  'startseite', 'suche', 'sitemap', 'pate werden', 'tiere', 'gassigeher',
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

function shouldSkip(name) {
  const lc = name.toLowerCase();
  return (
    name.length > 60 ||
    SKIP_HEADINGS.some(s => lc.includes(s)) ||
    /^\d/.test(name) ||
    name.includes('©') ||
    name.includes('http')
  );
}

/**
 * Parse the Jina markdown for the Hanau listing page.
 *
 * The page format (after Jina renders it) looks like:
 *   # Biggie
 *   **Rasse:** AmStaff-Terrier **Farbe:** Braun **Geboren:** 05/2018
 *   **Geschlecht:** männlich – kastriert **Größe:** 49 cm **Gewicht:** 30,4 kg **Im
 *   Tierheim seit:** 02.05.2025 Biggie ist fremden Menschen gegenüber…
 *   ![Image 31](url) …
 *
 * Key observations:
 * - Bold pairs are INLINE (possibly wrapping across lines mid-key, e.g. "**Im\nTierheim seit:**")
 * - Description follows immediately after the last metadata value
 * - The dog's own name often starts the description sentence
 */
function parseHanauMarkdown(markdown) {
  const cleaned = cleanupMarkdown(markdown);

  const dogs = [];

  // Normalize: Jina outputs "* * * # DogName" all on one line (HR + heading inline).
  // Convert every such occurrence to a proper newline-separated heading FIRST,
  // before searching for the footer or splitting into sections.
  const normalized = cleaned
    .replace(/\*\s*\*\s*\*\s*#/g, '\n\n#')  // * * * # → newline + #
    .replace(/\n{3,}/g, '\n\n');             // collapse extra blank lines

  // Cut at the footer/pate section (now detectable since it's on its own line)
  const footerIdx = normalized.search(/\n#{1,3}\s+(Übernahme|Impressum|Kontakt|Navigation|Datenschutz)/i);
  const content = footerIdx > 0 ? normalized.slice(0, footerIdx) : normalized;

  // Split by any H1-H3 heading (now at start of lines after normalization)
  const sections = content.split(/\n(?=#{1,3}\s+[^\s#])/);

  for (const section of sections) {
    const lines = section.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    // Heading → dog name
    // On tierschutz-hanau.de the ENTIRE dog entry is on one line after the heading:
    //   # Biggie **Rasse:** AmStaff-Terrier **Farbe:** Braun …
    // Extract ONLY the part before the first "**" as the name.
    const headingMatch = lines[0].match(/^#{1,3}\s+(.+)$/);
    if (!headingMatch) continue;
    const fullHeading = headingMatch[1];
    const name = fullHeading.split('**')[0].trim();
    if (!name || shouldSkip(name)) continue;

    // The rest of the heading line contains the metadata ("**Rasse:** …").
    // Join it with any subsequent lines to form the full body.
    const metaPart = fullHeading.slice(name.length).trim();

    // Images (keep from full section text before stripping links)
    const images = uniqueStrings(
      [...section.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/g)].map(m => m[1])
    );

    // Join body: metadata from heading + continuation lines
    const body = [metaPart, ...lines.slice(1)].join(' ');

    // ── Parse **Key:** Value pairs ──────────────────────────────────────────
    // Split on "**" tokens. Odd indices are usually key candidates (ending with ":"),
    // even indices are the corresponding values.
    const info = {};
    const parts = body.split('**');

    for (let i = 1; i < parts.length - 1; i += 2) {
      const rawKey = parts[i];
      if (!rawKey.endsWith(':')) continue; // not a key

      const key = rawKey
        .slice(0, -1)              // strip trailing ':'
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();

      const rawVal = (parts[i + 1] || '').trim();

      let val;
      if (key === 'im tierheim seit' || key.includes('seit')) {
        // Date value — take only the date part (dd.mm.yyyy or mm/yyyy)
        const dateMatch = rawVal.match(/\d{1,2}[./]\d{1,2}[./]\d{2,4}|\d{2}\/\d{4}/);
        val = dateMatch ? dateMatch[0] : rawVal.split(/\s+/).slice(0, 2).join(' ').slice(0, 25);
      } else {
        // Value is bounded by the split('**') already — just trim and cap length.
        // Do NOT apply the uppercase-cut here or breed names like "Jack Russel Terrier"
        // / "Old English Bulldog" will be truncated.
        val = rawVal.trim().slice(0, 150);
      }

      if (key && val) info[key] = val;
    }

    // Must have at least one known dog field to qualify
    if (!info['rasse'] && !info['geboren'] && !info['geschlecht'] && !info['gewicht']) continue;

    // ── Description ─────────────────────────────────────────────────────────
    // Find the text that follows after all metadata (after the "Im Tierheim seit" date or
    // after the last "**...**" block) and before the "Wenn Sie … kennenlernen" contact line.
    const sinceDate = info['im tierheim seit'] || '';
    let description = '';
    const sinceIdx = sinceDate ? body.lastIndexOf(sinceDate) : -1;
    const descStart = sinceIdx >= 0 ? sinceIdx + sinceDate.length : body.lastIndexOf('**') + 2;
    const rawDesc = body
      .slice(descStart)
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')   // remove images
      .replace(/\[[^\]]*\]\([^)]*\)/g, '')     // remove links
      .replace(/\*+/g, '')                      // remove remaining asterisks
      .replace(/Wenn Sie [\s\S]*$/, '')         // remove contact CTA
      .replace(/rufen Sie[\s\S]*$/, '')
      .replace(/\s+/g, ' ')
      .trim();
    description = rawDesc.slice(0, 700);

    const geschlecht = (info['geschlecht'] || '').toLowerCase();
    const groesse = info['größe'] || info['groesse'] || info['grosse'] || '';

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
      sex: geschlecht.includes('weiblich') ? 'weiblich' : geschlecht ? 'männlich' : '',
      neuteredStatus: geschlecht.includes('unkastriert')
        ? 'nicht kastriert'
        : geschlecht.includes('kastriert')
        ? 'kastriert'
        : '',
      size: deriveSizeLabel(groesse) || groesse,
      weight: info['gewicht'] || '',
      color: info['farbe'] || '',
      since: sinceDate,
      description,
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

