'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DogCard from '@/components/DogCard';
import FilterBar from '@/components/FilterBar';
import { useSearchParams, useRouter } from 'next/navigation';

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

export default function HundePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

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
          <h1 className="text-4xl font-extrabold text-white mb-2">
            🐕 Alle Hunde
          </h1>
          <p className="text-indigo-200">
            {allDogs.length} Hunde aus 4 Tierheimen — täglich aktuell via Web-Scraping
          </p>
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
            <p className="text-slate-500 mb-6">Starte den ersten Scrape um alle Hunde zu laden.</p>
            <button
              onClick={triggerScrape}
              disabled={scraping}
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {scraping ? 'Scraping…' : '🚀 Daten laden (dauert 1–2 Min.)'}
            </button>
          </div>
        )}

        {/* Empty: filtered out everything */}
        {!loading && !error && allDogs.length > 0 && filteredDogs.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-slate-700 font-semibold mb-2">Keine Ergebnisse für deine Filter</p>
            <button
              onClick={() => handleFilterChange({ sort: 'newest' })}
              className="text-indigo-600 underline text-sm"
            >
              Filter zurücksetzen
            </button>
          </div>
        )}

        {/* Dog grid */}
        {!loading && filteredDogs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 animate-fade-in">
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
