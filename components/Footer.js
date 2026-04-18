import Link from 'next/link';

export default function Footer() {
  const shelters = [
    { name: 'Tierheim Gelnhausen', url: 'https://tierheim-gelnhausen.org' },
    { name: 'Tierschutz Hanau', url: 'https://www.tierschutz-hanau.de' },
    { name: 'Tierheim Babenhausen', url: 'https://www.tierheim-babenhausen-hessen.de' },
    { name: 'TSV Darmstadt', url: 'https://www.tsv-darmstadt.de/hunde' },
  ];

  return (
    <footer className="bg-slate-900 text-slate-400 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                <span className="text-white text-base">🐾</span>
              </div>
              <span className="font-extrabold text-lg text-white">
                Pet<span className="text-indigo-400">Bridge</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              PetBridge bündelt die Tierangebote mehrerer Tierheime in der Region Rhein-Main
              und hilft dabei, Hunde schneller ein liebevolles Zuhause zu finden.
            </p>
            <p className="text-xs mt-4 text-slate-500">
              Alle Daten werden von den Tierheimen bezogen. Für Adoptionen und Auskünfte
              bitte direkt beim jeweiligen Tierheim melden.
            </p>
          </div>

          {/* Partner shelters */}
          <div>
            <h3 className="text-white font-semibold mb-4">Partner-Tierheime</h3>
            <ul className="space-y-2">
              {shelters.map(s => (
                <li key={s.name}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:text-indigo-400 transition-colors flex items-center gap-2"
                  >
                    <span className="text-indigo-500">→</span>
                    {s.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">PetBridge</h3>
            <ul className="space-y-2">
              {[
                { label: 'Hund adoptieren', href: '/hunde?status=available' },
                { label: 'Patenschaft übernehmen', href: '/hunde?status=sponsor' },
                { label: 'Neue Ankömmlinge', href: '/hunde?sort=newest' },
                { label: 'Wartet am längsten', href: '/hunde?sort=oldest' },
              ].map(l => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm hover:text-indigo-400 transition-colors flex items-center gap-2">
                    <span className="text-indigo-500">→</span>
                    {l.label}
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
