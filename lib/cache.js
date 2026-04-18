import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const DATA_DIR = join(process.cwd(), 'data');
const CACHE_FILE = join(DATA_DIR, 'dogs.json');
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export async function readCache() {
  try {
    const raw = await readFile(CACHE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { dogs: [], scrapedAt: null };
  }
}

export async function writeCache(dogs) {
  await mkdir(DATA_DIR, { recursive: true });
  const data = { dogs, scrapedAt: new Date().toISOString() };
  await writeFile(CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  return data;
}

export function isCacheStale(scrapedAt) {
  if (!scrapedAt) return true;
  return Date.now() - new Date(scrapedAt).getTime() > CACHE_TTL_MS;
}
