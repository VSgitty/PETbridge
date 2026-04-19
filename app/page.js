import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DogCard from '@/components/DogCard';
import StatsBar from '@/components/StatsBar';
import { readCache, writeCache, isCacheStale } from '@/lib/cache';
import { scrapeAll } from '@/lib/scrapers/index';
import { ALL_SHELTERS } from '@/lib/shelterConfig';

export const revalidate = 3600;

/** Fetch Wikipedia thumbnail for a single city (German Wikipedia). */
async function getCityThumbnail(wikiTitle) {
  try {
    const res = await fetch(
      `https://de.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.thumbnail?.source || null;
  } catch {
    return null;
  }
}

/** Fetch thumbnails for all shelters in parallel. Returns { [id]: url|null } */
async function getCityImages(shelters) {
  const results = await Promise.allSettled(
    shelters.map(s => getCityThumbnail(s.wikiTitle))
  );
  return Object.fromEntries(
    shelters.map((s, i) => [
      s.id,
      results[i].status === 'fulfilled' ? results[i].value : null,
    ])
  );
}

async function getDogs() {
  try {
    let cache = await readCache().catch(() => ({ dogs: [], scrapedAt: null }));
    // If cache is empty or stale, run a live scrape now
    if (!cache.dogs?.length || isCacheStale(cache.scrapedAt)) {
      const dogs = await scrapeAll(cache.dogs || []);
      if (dogs.length > 0) {
        cache = await writeCache(dogs).catch(() => ({ dogs, scrapedAt: new Date().toISOString() }));
      }
    }
    return cache;
  } catch (err) {
    console.error('[page getDogs]', err.message);
    return { dogs: [], scrapedAt: null };
  }
}

// ALL_SHELTERS is imported from shelterConfig above — no local const needed

export default async function HomePage() {
  const { dogs, scrapedAt } = await getDogs();
  const cityImages = await getCityImages(ALL_SHELTERS);

  const newest = [...dogs]
    .sort((a, b) => new Date(b.scrapedAt) - new Date(a.scrapedAt))
    .slice(0, 6);

  const longest = [...dogs]
    .filter(d => d.status === 'available' || d.status === 'sponsor')
    .sort((a, b) => (a.postedDate || a.since || '').localeCompare(b.postedDate || b.since || ''))
    .slice(0, 3);

  const totalAvailable = dogs.filter(d => d.status === 'available').length;
  const totalSponsor   = dogs.filter(d => d.status === 'sponsor').length;
  const shelterCount   = [...new Set(dogs.map(d => d.shelterCity).filter(Boolean))].length;

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f4ff]">
      <Header />

      {/* ── HERO ── */}
      <section className="hero-gradient hero-pattern relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-violet-600/25 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-indigo-400/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] rounded-full bg-purple-800/10 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/85 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
            {dogs.length > 0
              ? `${dogs.length} Hunde aus ${shelterCount} Tierheimen warten auf dich`
              : 'Tiervermittlungsplattform Rhein-Main'}
          </div>

          <div className="float-anim inline-block mb-2">
            <span className="text-6xl">🐾</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-black text-white mb-4 leading-tight tracking-tight">
            Pet<span className="text-violet-300">Bridge</span>
          </h1>
          <p className="text-xl sm:text-2xl text-indigo-200 font-semibold mb-3">
            Dein bester Freund wartet auf dich.
          </p>
          <p className="text-base text-indigo-300/90 max-w-2xl mx-auto mb-14 leading-relaxed">
            Alle Hunde aus {ALL_SHELTERS.length} Tierheimen in Hessen — mit Fotos, Profilen
            und dem direkten Weg zur Vermittlung. Täglich aktuell.
          </p>

          {/* ── THREE CTA BUBBLES ── */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
            <Link
              href="/hunde?status=available"
              className="cta-bubble group flex flex-col items-center justify-center w-48 h-48 rounded-full
                bg-gradient-to-br from-amber-400 to-orange-500
                text-white shadow-2xl shadow-orange-500/40"
            >
              <span className="text-5xl mb-2 group-hover:scale-110 transition-transform">🏠</span>
              <span className="font-extrabold text-lg">Adoptieren</span>
              <span className="text-xs text-orange-100 mt-1 font-medium">{totalAvailable} Hunde</span>
            </Link>

            <Link
              href="/hunde?status=sponsor"
              className="cta-bubble group flex flex-col items-center justify-center w-48 h-48 rounded-full
                bg-gradient-to-br from-amber-400 to-orange-500
                text-white shadow-2xl shadow-orange-500/40"
            >
              <span className="text-5xl mb-2 group-hover:scale-110 transition-transform">❤️</span>
              <span className="font-extrabold text-lg">Patenschaft</span>
              <span className="text-xs text-orange-100 mt-1 font-medium">{totalSponsor > 0 ? `${totalSponsor} offen` : 'Tierhelfen'}</span>
            </Link>

            <Link
              href="/spenden"
              className="cta-bubble group flex flex-col items-center justify-center w-48 h-48 rounded-full
                bg-gradient-to-br from-emerald-400 to-teal-600
                text-white shadow-2xl shadow-emerald-500/40"
            >
              <span className="text-5xl mb-2 group-hover:scale-110 transition-transform">💚</span>
              <span className="font-extrabold text-lg">Spenden</span>
              <span className="text-xs text-emerald-100 mt-1 font-medium">Direkt helfen</span>
            </Link>
          </div>

          {/* Search bar */}
          <form action="/hunde" method="GET" className="flex max-w-xl mx-auto gap-2">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-lg">🔍</span>
              <input
                type="text"
                name="search"
                placeholder="Name oder Rasse suchen…"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/25
                  text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-violet-400/70 text-base"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3.5 rounded-2xl bg-white text-indigo-700 font-bold hover:bg-indigo-50
                transition-colors shadow-lg text-sm whitespace-nowrap"
            >
              Suchen →
            </button>
          </form>
        </div>
      </section>

      {/* ── STATS ── */}
      <StatsBar dogs={dogs} scrapedAt={scrapedAt} />

      {/* ── PARTNER SHELTERS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center mb-10">
          <p className="section-label text-indigo-600 mb-3">
            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
            &nbsp;Unsere Tierheim-Partner
          </p>
          <h2 className="text-3xl font-extrabold text-slate-900">{ALL_SHELTERS.length} Tierheime, eine Plattform</h2>
          <p className="text-slate-500 mt-2 max-w-xl mx-auto text-sm">
            Alle Hunde direkt aus offiziellen hessischen Tierheimen — täglich synchronisiert.
            Klicke auf ein Tierheim, um alle dortigen Hunde zu sehen oder die Website direkt zu besuchen.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {ALL_SHELTERS.map(s => {
            const count = dogs.filter(d => d.shelterCity === s.city).length;
            return (
              <div key={s.city} className="shelter-card bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                {/* City banner image */}
                <div className="relative h-36 overflow-hidden bg-slate-200">
                  {cityImages[s.id] ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={cityImages[s.id]}
                      alt={`${s.city} Stadtbild`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                      <span className="text-5xl">{s.emoji}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                  <span className={`absolute bottom-2 left-3 text-[11px] font-bold uppercase tracking-widest text-white/90`}>
                    {s.city}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 mb-0.5 text-sm">{s.name}</h3>
                  <p className="text-xs text-slate-500 mb-3">
                    {count > 0 ? `${count} Hunde auf PetBridge` : 'Website besuchen →'}
                  </p>
                  {s.phone && (
                    <a
                      href={`tel:${s.phone.replace(/[\s/]/g, '')}`}
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 mb-3 transition-colors"
                    >
                      📞 {s.phone}
                    </a>
                  )}
                  <div className="flex gap-2 mt-2">
                    {count > 0 && (
                      <Link
                        href={`/hunde?shelter=${s.city}`}
                        className="flex-1 text-center py-2 rounded-xl bg-indigo-50 text-indigo-700
                          text-xs font-semibold hover:bg-indigo-100 transition-colors"
                      >
                        Hunde ({count})
                      </Link>
                    )}
                    <a
                      href={s.shelterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center py-2 rounded-xl border border-slate-200 text-slate-600
                        text-xs font-semibold hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                    >
                      Website →
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── NEWEST DOGS ── */}
      {newest.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="section-label text-emerald-600 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot inline-block" />
                &nbsp;Neu eingetroffen
              </p>
              <h2 className="text-3xl font-extrabold text-slate-900">Diese warten auf dich</h2>
            </div>
            <Link
              href="/hunde"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2
                border-indigo-200 text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors text-sm"
            >
              Alle {dogs.length} Hunde →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {newest.map(dog => <DogCard key={dog.id} dog={dog} />)}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/hunde"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600
                text-white font-bold hover:bg-indigo-700 transition-colors"
            >
              Alle {dogs.length} Hunde anzeigen →
            </Link>
          </div>
        </section>
      )}

      {/* ── LONGEST WAITING ── */}
      {longest.length > 0 && (
        <section
          className="py-16"
          style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <p className="section-label text-rose-400 mb-2">
                <span>❤️</span>&nbsp;Brauchen besondere Aufmerksamkeit
              </p>
              <h2 className="text-3xl font-extrabold text-white mt-1">Warten schon am längsten</h2>
              <p className="text-slate-400 mt-2 max-w-lg text-sm">
                Diese Hunde sind schon lange im Tierheim. Vielleicht ist dein bester Freund dabei?
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {longest.map(dog => <DogCard key={dog.id} dog={dog} />)}
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/hunde?sort=oldest"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-500
                  hover:bg-rose-600 text-white font-bold transition-colors"
              >
                Alle Langzeit-Wartenden →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <p className="section-label text-violet-600 mb-3">
            <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
            &nbsp;So einfach geht&apos;s
          </p>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-3">So funktioniert PetBridge</h2>
          <p className="text-slate-500 max-w-xl mx-auto text-sm">
            Einfach, schnell und transparent — damit der Weg zu deinem neuen Familienmitglied so kurz wie möglich ist.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '01', icon: '🔍', title: 'Entdecken',
              text: 'Stöbere durch alle Hunde aus Tierheimen in deiner Region. Filtere nach Größe, Alter, Geschlecht und Status.',
              color: 'from-indigo-500 to-violet-600',
            },
            {
              step: '02', icon: '💙', title: 'Verlieben',
              text: 'Lies die Geschichte des Hundes, schau alle Fotos an und entscheide, welcher Hund zu deinem Leben passt.',
              color: 'from-amber-500 to-orange-500',
            },
            {
              step: '03', icon: '🏠', title: 'Zur Vermittlung',
              text: 'Klick auf "Zur Vermittlung" und gelangst direkt zur Seite des Tierheims. Den Rest macht ihr gemeinsam.',
              color: 'from-emerald-500 to-teal-600',
            },
          ].map(s => (
            <div
              key={s.step}
              className="relative bg-white rounded-2xl p-8 shadow-sm border border-slate-200
                hover:border-indigo-200 hover:shadow-lg transition-all group"
            >
              <div className={`absolute -top-4 -left-4 w-10 h-10 rounded-2xl bg-gradient-to-br ${s.color}
                text-white text-sm font-black flex items-center justify-center shadow-lg`}>
                {s.step}
              </div>
              <div className="text-5xl mb-5 group-hover:scale-110 transition-transform inline-block">{s.icon}</div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-2">{s.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SPENDEN BANNER ── */}
      <section
        className="mx-4 sm:mx-8 lg:mx-auto max-w-5xl rounded-3xl mb-16 overflow-hidden shadow-xl"
        style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)' }}
      >
        <div className="p-8 sm:p-12 flex flex-col sm:flex-row items-center gap-8">
          <div className="text-6xl float-anim shrink-0">💚</div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
              Direkt spenden — sofort helfen
            </h3>
            <p className="text-emerald-200 text-base leading-relaxed mb-5">
              Nicht jeder kann adoptieren — aber jeder kann helfen. Deine Spende geht direkt an die
              Tierheime und finanziert Futter, Medizin und die tägliche Pflege.
            </p>
            <Link
              href="/spenden"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white
                text-emerald-700 font-extrabold hover:bg-emerald-50 transition-colors shadow-lg text-base"
            >
              💚 Jetzt spenden →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
