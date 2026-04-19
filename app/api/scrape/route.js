import { readCache, writeCache } from '@/lib/cache.js';
import { scrapeAll } from '@/lib/scrapers/index.js';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes for scraping

export async function POST() {
  try {
    // Read existing cache first so scrapeAll can fall back to it on parser failures
    const existing = await readCache().catch(() => ({ dogs: [] }));
    const dogs = await scrapeAll(existing.dogs || []);
    const cache = await writeCache(dogs);
    return Response.json({
      success: true,
      count: dogs.length,
      scrapedAt: cache.scrapedAt,
    });
  } catch (err) {
    console.error('[API/scrape]', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
