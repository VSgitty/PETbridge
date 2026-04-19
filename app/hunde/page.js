'use client';
import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DogCard from '@/components/DogCard';
import FilterBar from '@/components/FilterBar';
import { useSearchParams } from 'next/navigation';

function applyFilters(dogs, filters) {
  let result = [...dogs];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(d =>
      d.name?.toLowerCase().includes(q) ||
      d.breed?.toLowerCase().includes(q) ||
      d.description?.toLowerCase().includes(q)
    );
  }
  if (filters.shelter) {
    result = result.filter(d => d.shelterCity === filters.shelter);
  }
  if (filters.status) {
    result = result.filter(d => d.status === filters.status);
  }
  if (filters.sex) {
    result = result.filter(d => d.sex?.toLowerCase().includes(filters.sex.toLowerCase()));
  }
  if (filters.size) {
    result = result.filter(d => d.size?.includes(filters.size));
  }

  // Sort
  if (filters.sort === 'oldest') {
    result.sort((a, b) => (a.postedDate || a.since || '').localeCompare(b.postedDate || b.since || ''));
  } else if (filters.sort === 'az') {
    result.sort((a, b) => a.name.localeCompare(b.name, 'de'));
  } else {
    // newest (default)
    result.sort((a, b) => new Date(b.scrapedAt) - new Date(a.scrapedAt));
  }

  return result;
}

function HundePageInner() {
  const searchParams = useSearchParams();

  const [allDogs, setAllDogs] = useState([]);
  const [scrapedAt, setScrapedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    shelter: searchParams.get('shelter') || '',
    status: searchParams.get('status') || '',
    sex: searchParams.get('sex') || '',
    size: searchParams.get('size') || '',
    sort: searchParams.get('sort') || 'newest',
  });

  // Fetch dogs on mount
  useEffect(() => {
    setLoading(true);
    fetch('/api/dogs')
      .then(r => r.json())
      .then(data => {
        setAllDogs(data.dogs || []);
        setScrapedAt(data.scrapedAt);
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredDogs = useMemo(() => applyFilters(allDogs, filters), [allDogs, filters]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  // Manual scrape trigger
  const triggerScrape = async () => {
    setScraping(true);
    try {
      const res = await fetch('/api/scrape', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        // Reload dogs
        const dogsRes = await fetch('/api/dogs');
        const dogsData = await dogsRes.json();
        setAllDogs(dogsData.dogs || []);
        setScrapedAt(dogsData.scrapedAt);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setScraping(false);
    }
  };

  const lastUpdate = scrapedAt
    ? new Date(scrapedAt).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Page header */}
      <div className="hero-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-indigo-300 text-sm font-semibold uppercase tracking-wider mb-2">🐕 Alle Hunde</p>
              <h1 className="text-4xl font-extrabold text-white mb-1">
                Hunde aus 4 Tierheimen
              </h1>
              <p className="text-indigo-300 text-sm">
                {allDogs.length > 0 ? `${allDogs.length} Hunde verfügbar — täglich aktualisiert` : 'Wird geladen…'}
              </p>
            </div>
            <div className="flex gap-2">
              <a
                href="/hunde?status=available"
                className="px-4 py-2 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-200 text-sm font-semibold hover:bg-amber-400/30 transition-colors"
              >
                🏠 Adoptieren
              </a>
              <a
                href="/spenden"
                className="px-4 py-2 rounded-xl bg-emerald-400/20 border border-emerald-400/40 text-emerald-200 text-sm font-semibold hover:bg-emerald-400/30 transition-colors"
              >
                💚 Spenden
              </a>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">

        {/* Scrape control */}
        <div className="flex items-center justify-between mb-4">
          {lastUpdate && (
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
              Zuletzt gescrapt: {lastUpdate}
            </p>
          )}
          <button
            onClick={triggerScrape}
            disabled={scraping || loading}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {scraping ? (
              <>
                <span className="w-3 h-3 border-2 border-slate-400 border-t-indigo-600 rounded-full animate-spin" />
                Scraping läuft… (bis zu 2 Min.)
              </>
            ) : (
              <>⟳ Jetzt aktualisieren</>
            )}
          </button>
        </div>

        <FilterBar filters={filters} onChange={handleFilterChange} total={filteredDogs.length} />

        {/* Loading state */}
        {loading && (
          <div className="text-center py-24">
            <div className="inline-block w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
            <p className="text-slate-500">Hunde werden geladen…</p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-slate-700 font-semibold mb-2">Fehler beim Laden der Daten</p>
            <p className="text-slate-500 text-sm">{error}</p>
          </div>
        )}

        {/* Empty: no data yet, prompt scrape */}
        {!loading && !error && allDogs.length === 0 && (
          <div className="text-center py-24 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-5xl mb-4">🐾</div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Noch keine Daten</h2>
            <p className="text-slate-500 mb-6 max-w-md mx-auto text-sm">
              Beim ersten Start müssen die Tierheim-Daten erst abgerufen werden.
              Das dauert 1–2 Minuten.
            </p>
            <button
              onClick={triggerScrape}
              disabled={scraping}
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {scraping ? 'Scraping läuft…' : '🚀 Jetzt Daten laden'}
            </button>
            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-xs text-slate-400 mb-4">Oder besuche die Tierheime direkt:</p>
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  { name: 'Babenhausen', url: 'https://www.tierheim-babenhausen-hessen.de/tiere/hunde/' },
                  { name: 'Gelnhausen', url: 'https://tierheim-gelnhausen.org/hunde/' },
                  { name: 'Hanau', url: 'https://www.tierschutz-hanau.de/tiere/hunde-tierheim.html' },
                  { name: 'Darmstadt', url: 'https://www.tsv-darmstadt.de/hunde' },
                ].map(s => (
                  <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                    📍 {s.name} →
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty: filtered out everything */}
        {!loading && !error && allDogs.length > 0 && filteredDogs.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-slate-700 font-bold text-lg mb-2">Keine Ergebnisse</p>
            <p className="text-slate-500 text-sm mb-5">Kein Hund passt zu deinen Filtern. Versuche es mit anderen Kriterien.</p>
            <button
              onClick={() => handleFilterChange({ sort: 'newest' })}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors"
            >
              Filter zurücksetzen
            </button>
          </div>
        )}

        {/* Dog grid */}
        {!loading && filteredDogs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDogs.map(dog => (
              <DogCard key={dog.id} dog={dog} />
            ))}
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}

export default function HundePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
            <p className="text-slate-500">Wird geladen…</p>
          </div>
        </div>
        <Footer />
      </div>
    }>
      <HundePageInner />
    </Suspense>
  );
}
