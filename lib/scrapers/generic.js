/**
 * Generic Jina-reader-based scraper for Hessian Tierheim websites.
 *
 * Handles the most common German shelter website patterns:
 *  • WordPress with ## [Name](url) headings
 *  • Jimdo / static sites with ### Name headings
 *  • Sections with Rasse:, Geboren:, Geschlecht: key-value blocks
 *
 * When a site cannot be parsed (returns 0 dogs), the caller (scrapeAll)
 * falls back to the previously cached dogs for that shelter.
 */

import {
  slugify,
  stableId,
  cleanupMarkdown,
  uniqueStrings,
  deriveAgeLabel,
  deriveSizeLabel,
} from '../utils.js';

const JINA_BASE = 'https://r.jina.ai/';

// Words/phrases that indicate a heading is NOT a dog entry
const SKIP_RE = /^(impressum|kontakt|datenschutz|agb|home|aktuell|news|über\s|spenden|termine|events?|navigation|nav|header|footer|suche|sitemap|galerie|fotos?|presse|gassi|team|verein|mitglied|anfahrt|öffnungszeit|startseite|inhalts|rückmel|bericht|flyer|adoptiert|vermittelt|bereits\s+vermittelt|schon\s+vermittelt)/i;

async function fetchWithJina(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 28000);
  try {
    const res = await fetch(`${JINA_BASE}${url}`, {
      headers: {
        'User-Agent': 'PetBridge/1.0 (+https://petbridge.de)',
        Accept: 'text/markdown',
      },
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function shouldSkip(name) {
  if (!name || name.length < 2 || name.length > 75) return true;
  if (name.startsWith('http') || name.includes('@') || name.includes('©')) return true;
  if (/^\d+$/.test(name)) return true; // purely numeric
  return SKIP_RE.test(name.trim());
}

/** Returns true when a text block looks like it belongs to a dog profile */
function hasDogContext(text) {
  return /\b(rasse|breed|geboren|geb\.|alter|hündin|rüde|männlich|weiblich|mischling|schäfer|retriever|terrier|spitz|shepherd|husky|boxer|labrador|\bkg\b|\bcm\b|tierheim|pflegestell|pate)/i.test(
    text
  );
}

function parseSexNeuter(text) {
  const lc = text.toLowerCase();
  const sex =
    /weiblich|hündin/.test(lc)
      ? 'weiblich'
      : /männlich|rüde/.test(lc)
      ? 'männlich'
      : '';
  const neuteredStatus = /nicht\s+kastriert/.test(lc)
    ? 'nicht kastriert'
    : /kastriert/.test(lc)
    ? 'kastriert'
    : '';
  return { sex, neuteredStatus };
}

function parseBirth(text) {
  // Try full date DD.MM.YYYY
  const dateMatch = text.match(/\b(\d{1,2}[./]\d{1,2}[./]\d{2,4})\b/);
  if (dateMatch) {
    return { birthText: dateMatch[0], ageLabel: deriveAgeLabel(dateMatch[0]) };
  }
  // Just a year
  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    return { birthText: yearMatch[0], ageLabel: deriveAgeLabel(yearMatch[0]) };
  }
  // "X Jahre" or "X Monate" literal
  const literalMatch = text.match(/(\d+)\s*(Jahr[e]?|Monat[e]?|Woch[e]?|J\.)/i);
  if (literalMatch) {
    return { birthText: '', ageLabel: `${literalMatch[1]} ${literalMatch[2]}` };
  }
  return { birthText: '', ageLabel: '' };
}

function parseStatus(text) {
  const lc = text.toLowerCase();
  if (/interessent|reserviert/.test(lc)) return 'reserved';
  if (/geblockt/.test(lc)) return 'blocked';
  if (/patenhund|pate\s+gesucht|patenschaft/.test(lc)) return 'sponsor';
  if (/pflegestell|pflegefamil/.test(lc)) return 'foster';
  return 'available';
}

/**
 * Parse raw Jina markdown and extract dog entries for a given shelter config.
 */
function parseMarkdown(markdown, shelter) {
  const cleaned = cleanupMarkdown(markdown);

  // Cut off footer/navigation sections
  const footerIdx = cleaned.search(
    /\n#{1,3}\s*(Impressum|Kontakt|Datenschutz|Navigation|Header|Footer|Sitemap|Anfahrt|Öffnungszeit|Suche)/i
  );
  const body = footerIdx > 300 ? cleaned.slice(0, footerIdx) : cleaned;

  const dogs = [];

  // Split on any H2–H4 heading
  const sections = body.split(/\n(?=#{2,4}\s)/);

  for (const section of sections) {
    const lines = section
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);
    if (lines.length < 2) continue;

    // Extract name from heading — supports both linked and plain headings
    const headingMatch = lines[0].match(/^#{2,4}\s+(?:\[([^\]]+)\]\([^)]+\)|(.+))$/);
    if (!headingMatch) continue;

    const rawName = (headingMatch[1] || headingMatch[2] || '')
      .trim()
      .replace(/\*?(RESERVIERT|GEBLOCKT|VERMITTELT|ADOPTIERT)\*?/gi, '')
      .replace(/[-–—]\s*(externe\s+Vermittlung|Pflegestell[e]?)/gi, '')
      .trim();

    if (!rawName || shouldSkip(rawName)) continue;

    const sectionText = lines.slice(1).join('\n');
    // Must look like a dog entry — at least one dog-related keyword OR substantial text
    if (!hasDogContext(sectionText) && sectionText.length < 60) continue;

    // Images
    const images = uniqueStrings(
      [...section.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/g)].map(m => m[1])
    );

    // Profile link (link to the dog's own page on the shelter site)
    const profileMatch = section.match(
      new RegExp(
        `\\[([^\\]]+)\\]\\((https?://${shelter.shelterUrl
          .replace(/https?:\/\//, '')
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^)]+)\\)`,
        'i'
      )
    );
    const profileUrl = profileMatch?.[2] || shelter.url;

    // Parse key-value metadata and free-text description
    const info = {};
    const descLines = [];

    for (const line of lines.slice(1)) {
      const stripped = line
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
        .replace(/\[[^\]]*\]\([^)]*\)/g, '')
        .replace(/^[*_>]+|[*_]+$/g, '')
        .trim();

      if (!stripped || stripped.length < 2) continue;
      if (stripped.startsWith('#')) continue;

      const colonIdx = stripped.indexOf(':');
      if (colonIdx > 0 && colonIdx < 35) {
        const key = stripped.slice(0, colonIdx).trim().toLowerCase();
        const val = stripped.slice(colonIdx + 1).trim();
        if (val && !val.startsWith('http') && val.length < 200) {
          info[key] = val;
        }
      } else if (stripped.length > 20) {
        descLines.push(stripped);
      }
    }

    // Extract structured fields
    const birthSrc =
      info['geboren'] ||
      info['geburtsdatum'] ||
      info['geb'] ||
      info['geb.'] ||
      info['geburtstag'] ||
      info['alter'] ||
      '';
    const { birthText, ageLabel } = parseBirth(birthSrc || sectionText);

    const genderSrc = info['geschlecht'] || info['sex'] || sectionText;
    const { sex, neuteredStatus } = parseSexNeuter(genderSrc);

    const breed = info['rasse'] || info['breed'] || info['rasse/mix'] || info['race'] || '';
    const heightRaw =
      info['schulterhöhe'] ||
      info['schulterhoehe'] ||
      info['größe'] ||
      info['groesse'] ||
      '';
    const size = info['größe'] || info['size'] || deriveSizeLabel(heightRaw);

    dogs.push({
      id: stableId(shelter.id, rawName),
      name: rawName,
      slug: slugify(rawName),
      shelter: shelter.name,
      shelterCity: shelter.city,
      shelterPhone: shelter.phone || '',
      shelterEmail: shelter.email || '',
      shelterUrl: shelter.shelterUrl,
      profileUrl,
      image: images[0] || null,
      images,
      breed,
      birthText,
      ageLabel,
      sex,
      neuteredStatus,
      size,
      weight: info['gewicht'] || '',
      color: info['farbe'] || '',
      since:
        info['im tierheim seit'] ||
        info['aufnahme'] ||
        info['seit'] ||
        info['eingang'] ||
        '',
      description: descLines.slice(0, 4).join('\n\n').slice(0, 700),
      status: parseStatus(rawName + '\n' + sectionText),
      scrapedAt: new Date().toISOString(),
    });
  }

  return dogs;
}

/**
 * Main entry point — scrapes one shelter using the generic Jina approach.
 * Always resolves (never rejects); returns [] on failure.
 */
export async function scrapeGeneric(shelter) {
  try {
    const raw = await fetchWithJina(shelter.url);
    const dogs = parseMarkdown(raw, shelter);
    console.log(`  [Generic/${shelter.city}] ${dogs.length} dogs from ${shelter.url}`);
    return dogs;
  } catch (err) {
    const reason = err.name === 'AbortError' ? 'timeout' : err.message;
    console.warn(`  [Generic/${shelter.city}] SKIP — ${reason}`);
    return [];
  }
}
