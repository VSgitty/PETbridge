import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DogCard from '@/components/DogCard';
import StatsBar from '@/components/StatsBar';
import { readCache } from '@/lib/cache';

export const revalidate = 3600; // revalidate every hour

async function getDogs() {
  try {
    const cache = await readCache();
    return cache;
  } catch {
    return { dogs: [], scrapedAt: null };
  }
}

export default async function HomePage() {
  const { dogs, scrapedAt } = await getDogs();

  // Newest arrivals: sort by scrapedAt, take 6
  const newest = [...dogs]
    .sort((a, b) => new Date(b.scrapedAt) - new Date(a.scrapedAt))
    .slice(0, 6);

  // Longest waiting: those with postedDate or since
  const longest = [...dogs]
    .filter(d => d.status === 'available' || d.status === 'sponsor')
    .sort((a, b) => {
      const da = a.postedDate || a.since || '';
      const db = b.postedDate || b.since || '';
      return da.localeCompare(db);
    })
    .slice(0, 3);

  const totalAvailable = dogs.filter(d => d.status === 'available').length;
  const shelterCount = [...new Set(dogs.map(d => d.shelterCity).filter(Boolean))].length;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* ── HERO ── */}
      <section className="hero-gradient relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-violet-600/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-indigo-400/20 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
            {dogs.length > 0 ? `${dogs.length} Hunde warten auf ein Zuhause` : 'Tiervermittlungsplattform'}
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            Pet<span className="text-violet-300">Bridge</span>
          </h1>
          <p className="text-xl sm:text-2xl text-indigo-200 font-medium mb-3">
            Dein bester Freund wartet auf dich.
          </p>
          <p className="text-base text-indigo-300 max-w-2xl mx-auto mb-12">
            Wir bündeln alle Hunde aus {shelterCount} Tierheimen in Rhein-Main — mit Fotos, Fakten und dem direkten Weg zum Tierheim.
            Täglich aktuell.
          </p>

          {/* Two main CTA circles — matching mockup */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
            <Link
              href="/hunde?status=available"
              className="group flex flex-col items-center justify-center w-44 h-44 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-2xl shadow-orange-500/40 hover:scale-105 transition-all duration-300"
            >
              <span className="text-4xl mb-2">🏠</span>
              <span className="font-bold text-lg">Adoptieren</span>
              <span className="text-xs text-orange-100 mt-1">{totalAvailable} Hunde</span>
            </Link>

            <Link
              href="/hunde?status=sponsor"
              className="group flex flex-col items-center justify-center w-44 h-44 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-2xl shadow-orange-500/40 hover:scale-105 transition-all duration-300"
            >
              <span className="text-4xl mb-2">❤️</span>
              <span className="font-bold text-lg">Patenschaft</span>
              <span className="text-xs text-orange-100 mt-1">Fernhelfen</span>
            </Link>
          </div>

          {/* Quick search */}
          <form action="/hunde" method="GET" className="flex max-w-lg mx-auto gap-2">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">📍</span>
              <input
                type="text"
                name="search"
                placeholder="Name oder Rasse suchen…"
                className="w-full pl-11 pr-4 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 text-base"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-4 rounded-2xl bg-white text-indigo-700 font-bold hover:bg-indigo-50 transition-colors shadow-lg"
            >
              Suchen
            </button>
          </form>
        </div>
      </section>

      {/* ── STATS ── */}
      <StatsBar dogs={dogs} scrapedAt={scrapedAt} />

      {/* ── NEWEST DOGS ── */}
      {newest.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 pulse-dot" />
                <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">Neu eingetroffen</span>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900">Diese warten auf dich</h2>
            </div>
            <Link
              href="/hunde"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-indigo-200 text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors"
            >
              Alle anzeigen →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {newest.map(dog => <DogCard key={dog.id} dog={dog} />)}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link href="/hunde" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors">
              Alle {dogs.length} Hunde anzeigen →
            </Link>
          </div>
        </section>
      )}

      {/* ── LONGEST WAITING (emotional section) ── */}
      {longest.length > 0 && (
        <section className="bg-gradient-to-br from-slate-800 to-slate-900 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <span className="text-sm font-semibold text-rose-400 uppercase tracking-wide">❤️ Brauchen besondere Aufmerksamkeit</span>
              <h2 className="text-3xl font-extrabold text-white mt-1">Warten schon am längsten</h2>
              <p className="text-slate-400 mt-2">Diese Hunde verdienen auch eine Chance.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {longest.map(dog => <DogCard key={dog.id} dog={dog} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-4">So funktioniert PetBridge</h2>
        <p className="text-slate-500 text-center mb-12 max-w-xl mx-auto">
          Einfach, schnell und transparent — damit der Weg zum neuen Familienmitglied so kurz wie möglich ist.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '01', icon: '🔍', title: 'Entdecken', text: 'Stöbere durch alle Hunde aus Tierheimen in deiner Region. Filtere nach Größe, Alter, Geschlecht und mehr.' },
            { step: '02', icon: '❤️', title: 'Verlieben', text: 'Lies die Geschichte des Hundes, schau alle Fotos an und entscheide, welcher Hund zu deinem Leben passt.' },
            { step: '03', icon: '🏠', title: 'Kontaktieren', text: 'Melde dich direkt beim Tierheim. PetBridge vermittelt den Erstkontakt — den Rest macht ihr gemeinsam.' },
          ].map(s => (
            <div key={s.step} className="relative bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all">
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-md">
                {s.step}
              </div>
              <div className="text-4xl mb-4">{s.icon}</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{s.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PARTNER SHELTERS ── */}
      <section className="bg-indigo-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-500 text-sm font-medium uppercase tracking-wide mb-6">Unsere Tierheim-Partner</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {[
              'Tierheim Gelnhausen',
              'Tierschutz Hanau',
              'Tierheim Babenhausen',
              'TSV Darmstadt',
            ].map(name => (
              <div key={name} className="px-5 py-2.5 rounded-xl bg-white border border-indigo-100 text-slate-700 font-semibold text-sm shadow-sm">
                📍 {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NO DATA STATE ── */}
      {dogs.length === 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="text-6xl mb-4">🐾</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Daten werden geladen…</h2>
          <p className="text-slate-500 mb-6">Beim ersten Start müssen die Tierheim-Daten erst einmal abgerufen werden.</p>
          <a
            href="/api/scrape"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors"
          >
            Jetzt scrapen
          </a>
        </section>
      )}

      <Footer />
    </div>
  );
}
