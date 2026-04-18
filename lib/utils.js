import crypto from 'node:crypto';

export function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'unbekannt';
}

export function stableId(...parts) {
  return crypto
    .createHash('sha1')
    .update(parts.filter(Boolean).join('|'))
    .digest('hex')
    .slice(0, 16);
}

export function cleanupMarkdown(raw) {
  return String(raw || '')
    .replace(/^Title:[\s\S]*?Markdown Content:\s*/i, '')
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean))];
}

export function deriveAgeLabel(birthText) {
  if (!birthText) return '';
  const yearMatch = birthText.match(/\b(19|20)\d{2}\b/);
  if (!yearMatch) return birthText;
  const year = parseInt(yearMatch[0]);
  const age = new Date().getFullYear() - year;
  if (age <= 0) return 'Welpe';
  if (age === 1) return 'ca. 1 Jahr';
  if (age <= 2) return 'ca. 2 Jahre';
  if (age >= 8) return `Senior (${age} J.)`;
  return `ca. ${age} Jahre`;
}

export function deriveSizeLabel(height) {
  if (!height) return '';
  const cm = parseInt(height);
  if (isNaN(cm)) return height;
  if (cm <= 35) return 'Klein';
  if (cm <= 50) return 'Mittel';
  if (cm <= 65) return 'Groß';
  return 'Sehr groß';
}
