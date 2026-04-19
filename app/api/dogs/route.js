import { readCache, writeCache, isCacheStale } from '@/lib/cache.js';
import { scrapeAll } from '@/lib/scrapers/index.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('refresh') === '1';

  let cache = await readCache();

  if (forceRefresh || isCacheStale(cache.scrapedAt)) {
    try {
      // Pass existing dogs so shelters that fail to scrape keep their cached data
      const dogs = await scrapeAll(cache.dogs || []);
      cache = await writeCache(dogs);
    } catch (err) {
      console.error('[API/dogs] Scrape failed, serving stale cache:', err.message);
    }
  }

  return Response.json(cache, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
