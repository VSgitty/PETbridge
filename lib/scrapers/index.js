import { scrapeBabenhausen } from './babenhausen.js';
import { scrapeGelnhausen } from './gelnhausen.js';
import { scrapeHanau } from './hanau.js';
import { scrapeDarmstadt } from './darmstadt.js';

export async function scrapeAll() {
  console.log('[PetBridge] Starting full scrape…');
  const start = Date.now();

  const [babenhausen, gelnhausen, hanau, darmstadt] = await Promise.allSettled([
    scrapeBabenhausen(),
    scrapeGelnhausen(),
    scrapeHanau(),
    scrapeDarmstadt(),
  ]);

  const logResult = (name, result) => {
    if (result.status === 'fulfilled') {
      console.log(`  ✓ ${name}: ${result.value.length} dogs`);
      return result.value;
    } else {
      console.error(`  ✗ ${name}: ${result.reason?.message}`);
      return [];
    }
  };

  const dogs = [
    ...logResult('Babenhausen', babenhausen),
    ...logResult('Gelnhausen', gelnhausen),
    ...logResult('Hanau', hanau),
    ...logResult('Darmstadt', darmstadt),
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
