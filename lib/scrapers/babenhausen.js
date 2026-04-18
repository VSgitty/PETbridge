/**
 * Babenhausen scraper — reuses the same Jina + markdown parsing
 * approach as the existing tierheim-babenhausen-app project.
 */
import { slugify, stableId, cleanupMarkdown, uniqueStrings, deriveAgeLabel, deriveSizeLabel } from '../utils.js';

const JINA_BASE = 'https://r.jina.ai/';

const SOURCES = [
  {
    id: 'babenhausen-bis-2024',
    url: 'https://www.tierheim-babenhausen-hessen.de/tiere/hunde/hunde-geb-bis-2024/',
    title: 'Hunde geb. bis 2024',
  },
  {
    id: 'babenhausen-ab-2025',
    url: 'https://www.tierheim-babenhausen-hessen.de/tiere/hunde/hunde-geb-ab-2025/',
    title: 'Hunde geb. ab 2025',
  },
];

async function fetchWithJina(url) {
  const res = await fetch(`${JINA_BASE}${url}`, {
    headers: { 'User-Agent': 'PetBridge/1.0', Accept: 'text/markdown' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function cutAtFooter(content) {
  const idx = content.search(/\n#\s+(Öffnungszeiten|Gassizeiten|Kontakt|Impressum|Footer)/i);
  return idx === -1 ? content : content.slice(0, idx).trim();
}

function extractBlocks(content) {
  const cleaned = cutAtFooter(cleanupMarkdown(content));
  const regex = /(^|\n)([^\n#![\]|*_][^\n]{0,80})\n+geb\.?/g;
  const starts = [];
  let m;
  while ((m = regex.exec(cleaned)) !== null) {
    const name = (m[2] || '').trim();
    if (!name || name.length > 80) continue;
    starts.push({ name, index: m.index + m[0].lastIndexOf(name) });
  }
  return starts.map((entry, i) => {
    const next = starts[i + 1];
    return cleaned.slice(entry.index, next ? next.index : cleaned.length).trim();
  }).filter(Boolean);
}

function parseMetaLine(line) {
  const stripped = line.replace(/^geb\.?\s*/i, '').trim();
  const sexMatch = stripped.match(/\b(männlich|weiblich|Böckchen)\b/i);
  let birthText = '', remainder = stripped;
  if (sexMatch && typeof sexMatch.index === 'number') {
    birthText = stripped.slice(0, sexMatch.index).replace(/\s*\|+\s*$/, '').trim();
    remainder = stripped.slice(sexMatch.index).trim();
  } else {
    const parts = stripped.split('|').map(p => p.trim()).filter(Boolean);
    birthText = parts.shift() || '';
    remainder = parts.join(' | ');
  }
  const parts = remainder.split('|').map(p => p.trim()).filter(Boolean);
  const sexNeuter = parts[0] || '';
  const breed = parts.find(p => !/Schulterhöhe:/i.test(p) && p !== sexNeuter) || '';
  const heightMatch = remainder.match(/Schulterhöhe:\s*([^|]+)/i);
  return {
    birthText,
    sex: /weiblich/i.test(sexNeuter) ? 'weiblich' : 'männlich',
    neuteredStatus: /nicht kastriert/i.test(sexNeuter) ? 'nicht kastriert'
      : /kastriert/i.test(sexNeuter) ? 'kastriert' : '',
    breed,
    height: heightMatch ? heightMatch[1].trim() : '',
  };
}

function deriveStatus({ name, description }) {
  const hay = `${name}\n${description}`.toLowerCase();
  if (/interessenten/.test(hay)) return 'reserved';
  if (/patenhund/.test(hay)) return 'sponsor';
  if (/pflegestelle/.test(hay)) return 'foster';
  return 'available';
}

function parseBlock(block, source) {
  const firstNl = block.indexOf('\n');
  if (firstNl === -1) return null;
  const name = block.slice(0, firstNl).trim();
  let body = block.slice(firstNl).trim();

  const images = uniqueStrings(
    [...body.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/g)].map(m => m[1])
  );
  body = body.replace(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/g, '').trim();

  const lines = body.split('\n').map(l => l.trim()).filter(Boolean);
  const metaIdx = lines.findIndex(l => /^geb\.?/i.test(l));
  if (metaIdx === -1) return null;

  const meta = parseMetaLine(lines[metaIdx]);
  const descLines = lines.filter((_, i) => i !== metaIdx);
  const description = descLines.join(' ').trim();

  const cleanName = name.replace(/\s+/g, ' ').trim();

  return {
    id: stableId(source.id, cleanName, meta.birthText),
    name: cleanName,
    slug: slugify(cleanName),
    shelter: 'Tierheim Babenhausen',
    shelterCity: 'Babenhausen',
    shelterPhone: '06073 / 72 37 1',
    shelterEmail: 'info@tierheim-babenhausen-hessen.de',
    shelterUrl: 'https://www.tierheim-babenhausen-hessen.de',
    profileUrl: source.url,
    image: images[0] || null,
    images,
    breed: meta.breed,
    birthText: meta.birthText,
    ageLabel: deriveAgeLabel(meta.birthText),
    sex: meta.sex,
    neuteredStatus: meta.neuteredStatus,
    size: deriveSizeLabel(meta.height),
    height: meta.height,
    description: description.slice(0, 600),
    status: deriveStatus({ name: cleanName, description }),
    scrapedAt: new Date().toISOString(),
  };
}

export async function scrapeBabenhausen() {
  const results = [];
  for (const source of SOURCES) {
    try {
      const raw = await fetchWithJina(source.url);
      const blocks = extractBlocks(raw);
      const parsed = blocks.map(b => parseBlock(b, source)).filter(Boolean);
      console.log(`[Babenhausen] ${source.id}: ${parsed.length} dogs`);
      results.push(...parsed);
    } catch (err) {
      console.error(`[Babenhausen] Error on ${source.id}:`, err.message);
    }
  }
  return results;
}
