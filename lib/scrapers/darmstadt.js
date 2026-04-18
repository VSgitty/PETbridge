/**
 * TSV Darmstadt dog scraper.
 * Generic approach – adapts to whatever format the Jina reader returns.
 */
import { slugify, stableId, cleanupMarkdown, uniqueStrings, deriveAgeLabel } from '../utils.js';

const JINA_BASE = 'https://r.jina.ai/';
const LISTING_URL = 'https://www.tsv-darmstadt.de/hunde';

async function fetchWithJina(url) {
  const res = await fetch(`${JINA_BASE}${url}`, {
    headers: { 'User-Agent': 'PetBridge/1.0', Accept: 'text/markdown' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

export async function scrapeDarmstadt() {
  try {
    const markdown = await fetchWithJina(LISTING_URL);
    const cleaned = cleanupMarkdown(markdown);

    // Cut at footer
    const footerIdx = cleaned.search(/\n#{1,3}\s+(Impressum|Kontakt|Datenschutz|Footer|Navigation)/i);
    const content = footerIdx > 0 ? cleaned.slice(0, footerIdx) : cleaned;

    const dogs = [];

    // Try finding dog entries: each dog is a heading with name
    // followed by info block. Generic parsing.
    const sections = content.split(/\n(?=#{1,4}\s+[^\s#])/);

    for (const section of sections) {
      const lines = section.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 3) continue;

      const headingMatch = lines[0].match(/^#{1,4}\s+(.+)$/);
      if (!headingMatch) continue;
      const name = headingMatch[1].trim();
      if (name.length > 60 || /^(Hunde|Tiere|Verein|Kontakt|Home|Aktuell|Über uns|TSV)/i.test(name)) continue;

      const images = uniqueStrings(
        [...section.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/g)].map(m => m[1])
      );

      const info = {};
      const descParts = [];
      for (const line of lines.slice(1)) {
        const stripped = line.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[[^\]]*\]\([^)]*\)/g, '').trim();
        const colonIdx = stripped.indexOf(':');
        if (colonIdx > 0 && colonIdx < 30) {
          const key = stripped.slice(0, colonIdx).trim().toLowerCase();
          const val = stripped.slice(colonIdx + 1).trim();
          if (val) info[key] = val;
        } else if (stripped.length > 30) {
          descParts.push(stripped);
        }
      }

      // Only add if it looks like a dog entry (has some meta info)
      if (!info['rasse'] && !info['geboren'] && !info['geschlecht'] && !info['breed'] && !info['alter']) {
        if (descParts.length === 0) continue;
      }

      const geschlecht = info['geschlecht'] || '';

      dogs.push({
        id: stableId('darmstadt', name),
        name,
        slug: slugify(name),
        shelter: 'TSV Darmstadt',
        shelterCity: 'Darmstadt',
        shelterPhone: '',
        shelterEmail: '',
        shelterUrl: 'https://www.tsv-darmstadt.de',
        profileUrl: LISTING_URL,
        image: images[0] || null,
        images,
        breed: info['rasse'] || info['breed'] || '',
        birthText: info['geboren'] || info['geburtsdatum'] || '',
        ageLabel: deriveAgeLabel(info['geboren'] || info['geburtsdatum'] || ''),
        sex: geschlecht.toLowerCase().includes('weiblich') ? 'weiblich'
          : geschlecht ? 'männlich' : '',
        neuteredStatus: geschlecht.toLowerCase().includes('kastriert') ? 'kastriert' : '',
        size: info['größe'] || '',
        weight: info['gewicht'] || '',
        color: info['farbe'] || '',
        since: info['im tierheim seit'] || '',
        description: descParts.slice(0, 3).join('\n\n').slice(0, 600),
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
