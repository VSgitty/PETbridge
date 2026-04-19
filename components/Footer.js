import Link from 'next/link';

export default function Footer() {
  const shelters = [
    { name: 'Tierheim Gelnhausen', url: 'https://tierheim-gelnhausen.org' },
    { name: 'Tierschutz Hanau', url: 'https://www.tierschutz-hanau.de' },
    { name: 'Tierheim Babenhausen', url: 'https://www.tierheim-babenhausen-hessen.de' },
    { name: 'TSV Darmstadt', url: 'https://www.tsv-darmstadt.de/hunde' },
  ];

  return (
    <footer className="bg-slate-900 text-slate-400 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">🐾</span>
              </div>
              <span className="font-black text-lg text-white">
                Pet<span className="text-indigo-400">Bridge</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-500 mb-4">
              PetBridge bündelt Tierangebote aus 4 Tierheimen in Rhein-Main und hilft,
              Hunde schneller ein liebevolles Zuhause zu finden.
            </p>
            <Link
              href="/spenden"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600/20
                border border-emerald-600/30 text-emerald-400 text-sm font-semibold
                hover:bg-emerald-600/30 transition-colors"
            >
              💚 Spenden
            </Link>
          </div>

          {/* Partner shelters */}
          <div>
            <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Tierheim-Partner</h3>
            <ul className="space-y-2">
              {shelters.map(s => (
                <li key={s.name}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:text-indigo-400 transition-colors flex items-center gap-2"
                  >
                    <span className="text-indigo-600">→</span>
                    {s.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* PetBridge links */}
          <div>
            <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">PetBridge</h3>
            <ul className="space-y-2">
              {[
                { label: 'Alle Hunde', href: '/hunde' },
                { label: 'Hund adoptieren', href: '/hunde?status=available' },
                { label: 'Patenschaft übernehmen', href: '/hunde?status=sponsor' },
                { label: 'Neue Ankömmlinge', href: '/hunde?sort=newest' },
                { label: 'Wartet am längsten', href: '/hunde?sort=oldest' },
              ].map(l => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm hover:text-indigo-400 transition-colors flex items-center gap-2">
                    <span className="text-indigo-600">→</span>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Spenden */}
          <div>
            <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Spenden</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-4">
              PetBridge ist kostenlos und nicht-kommerziell.
              Alle Spenden gehen direkt an die Tierheime.
            </p>
            <ul className="space-y-2">
              {shelters.map(s => (
                <li key={s.name}>
                  <Link
                    href="/spenden"
                    className="text-sm hover:text-emerald-400 transition-colors flex items-center gap-2"
                  >
                    <span className="text-emerald-600">💚</span>
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} PetBridge — ein unabhängiges Projekt zur Tiervermittlung.
            Kein kommerzielles Angebot.
          </p>
          <p className="text-xs text-slate-600">
            Daten werden automatisch von den Tierheim-Webseiten aktualisiert.
          </p>
        </div>
      </div>
    </footer>
  );
}
