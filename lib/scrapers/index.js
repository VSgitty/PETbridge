import { scrapeBabenhausen } from './babenhausen.js';
import { scrapeGelnhausen } from './gelnhausen.js';
import { scrapeHanau } from './hanau.js';
import { scrapeDarmstadt } from './darmstadt.js';

/**
 * Scrape all shelters. Pass existingDogs so that if a scraper returns 0 results
 * (likely a parse failure), we keep the previously cached dogs for that shelter
 * instead of wiping them out.
 */
export async function scrapeAll(existingDogs = []) {
  console.log('[PetBridge] Starting full scrape…');
  const start = Date.now();

  const [babenhausen, gelnhausen, hanau, darmstadt] = await Promise.allSettled([
    scrapeBabenhausen(),
    scrapeGelnhausen(),
    scrapeHanau(),
    scrapeDarmstadt(),
  ]);

  // Group existing cached dogs by shelter so we can fall back to them
  const cachedByShelter = {
    Babenhausen: existingDogs.filter(d => d.shelterCity === 'Babenhausen'),
    Gelnhausen:  existingDogs.filter(d => d.shelterCity === 'Gelnhausen'),
    Hanau:       existingDogs.filter(d => d.shelterCity === 'Hanau'),
    Darmstadt:   existingDogs.filter(d => d.shelterCity === 'Darmstadt'),
  };

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

  const dogs = [
    ...resolveResult('Babenhausen', 'Babenhausen', babenhausen),
    ...resolveResult('Gelnhausen',  'Gelnhausen',  gelnhausen),
    ...resolveResult('Hanau',       'Hanau',        hanau),
    ...resolveResult('Darmstadt',   'Darmstadt',    darmstadt),
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
