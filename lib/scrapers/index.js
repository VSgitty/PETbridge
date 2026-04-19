import { scrapeBabenhausen } from './babenhausen.js';
import { scrapeGelnhausen } from './gelnhausen.js';
import { scrapeHanau } from './hanau.js';
import { scrapeDarmstadt } from './darmstadt.js';
import { scrapeGeneric } from './generic.js';
import { GENERIC_SHELTERS } from '../shelterConfig.js';

/**
 * Scrape all shelters (4 specific + all generic Hessian shelters).
 * Pass existingDogs so that if a scraper returns 0 results (likely a parse
 * failure), we keep the previously cached dogs for that shelter instead of
 * wiping them out.
 */
export async function scrapeAll(existingDogs = []) {
  console.log('[PetBridge] Starting full scrape…');
  const start = Date.now();

  // Group existing cached dogs by shelterCity for fallback
  const cachedByShelter = {};
  for (const dog of existingDogs) {
    const city = dog.shelterCity;
    if (city) {
      cachedByShelter[city] = cachedByShelter[city] || [];
      cachedByShelter[city].push(dog);
    }
  }

  const resolveResult = (name, city, result) => {
    if (result.status === 'fulfilled' && result.value.length > 0) {
      console.log(`  ✓ ${name}: ${result.value.length} dogs`);
      return result.value;
    }
    if (result.status === 'rejected') {
      console.error(`  ✗ ${name}: ${result.reason?.message}`);
    } else {
      console.warn(`  ⚠ ${name}: scraper returned 0 dogs`);
    }
    // Fall back to cached data for this shelter
    const cached = cachedByShelter[city] || [];
    if (cached.length > 0) {
      console.log(`  ↩ ${name}: using ${cached.length} cached dogs as fallback`);
      return cached;
    }
    return [];
  };

  // Run specific scrapers and all generic scrapers in parallel
  const [babenhausen, gelnhausen, hanau, darmstadt, ...genericResults] =
    await Promise.allSettled([
      scrapeBabenhausen(),
      scrapeGelnhausen(),
      scrapeHanau(),
      scrapeDarmstadt(),
      ...GENERIC_SHELTERS.map(s => scrapeGeneric(s)),
    ]);

  const dogs = [
    ...resolveResult('Babenhausen', 'Babenhausen', babenhausen),
    ...resolveResult('Gelnhausen',  'Gelnhausen',  gelnhausen),
    ...resolveResult('Hanau',       'Hanau',        hanau),
    ...resolveResult('Darmstadt',   'Darmstadt',    darmstadt),
    ...genericResults.flatMap((result, i) => {
      const shelter = GENERIC_SHELTERS[i];
      return resolveResult(shelter.name, shelter.city, result);
    }),
  ];

  // Deduplicate by id
  const seen = new Set();
  const unique = dogs.filter(d => {
    if (seen.has(d.id)) return false;
    seen.add(d.id);
    return true;
  });

  console.log(`[PetBridge] Scrape done in ${Date.now() - start}ms — ${unique.length} unique dogs`);
  return unique;
}
