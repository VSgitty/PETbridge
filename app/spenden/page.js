import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Spenden – PetBridge | Direkt den Tierheimen helfen',
  description: 'Deine Spende geht direkt an die Tierheime. Finanziere Futter, Medizin und Pflege für wartende Hunde in Rhein-Main.',
};

const SHELTERS = [
  {
    name: 'Tierheim Babenhausen',
    city: 'Babenhausen',
    emoji: '🏡',
    color: 'from-indigo-500 to-violet-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    url: 'https://www.tierheim-babenhausen-hessen.de',
    donateUrl: 'https://www.tierheim-babenhausen-hessen.de/spenden/',
    iban: 'DE12 5085 0150 0000 2062 30',
    bic: 'BELADEBEXXX',
    bank: 'Kreissparkasse Groß-Gerau',
    phone: '06073 / 72 37 1',
    email: 'info@tierheim-babenhausen-hessen.de',
    description:
      'Das Tierheim Babenhausen betreut Hunde, Katzen und Kleintiere aus dem Landkreis Groß-Gerau. Spenden fließen direkt in Futterkosten, tierärztliche Versorgung und Ausstattung.',
  },
  {
    name: 'Tierheim Gelnhausen',
    city: 'Gelnhausen',
    emoji: '🌿',
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    url: 'https://tierheim-gelnhausen.org',
    donateUrl: 'https://tierheim-gelnhausen.org/spenden/',
    iban: 'DE49 5065 1701 0000 0507 28',
    bic: 'HELADEF1GEL',
    bank: 'Sparkasse Gelnhausen',
    phone: '06051 / 2550',
    email: 'webmaster@tierheim-gelnhausen.de',
    description:
      'Der Tierschutzverein Gelnhausen betreibt das einzige Tierheim im Main-Kinzig-Kreis. Deine Spende hilft, Hunden aus dem Tierheim und aus privaten Abgaben ein sicheres Zuhause zu bieten.',
  },
  {
    name: 'Tierschutz Hanau',
    city: 'Hanau',
    emoji: '🌻',
    color: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    url: 'https://www.tierschutz-hanau.de',
    donateUrl: 'https://www.tierschutz-hanau.de/spenden.html',
    iban: 'DE58 5065 0023 0000 5051 80',
    bic: 'HELADEF1HAN',
    bank: 'Sparkasse Hanau',
    phone: '06181 / 92 12 35',
    email: 'info@tierschutz-hanau.de',
    description:
      'Der Tierschutzverein Hanau e.V. ist seit Jahrzehnten aktiv. Das Tierheim nimmt jährlich Hunderte Tiere auf. Spenden fließen in Medizin, Personal und Infrastruktur.',
  },
  {
    name: 'TSV Darmstadt',
    city: 'Darmstadt',
    emoji: '💜',
    color: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    url: 'https://www.tsv-darmstadt.de',
    donateUrl: 'https://www.tsv-darmstadt.de/spenden',
    iban: '',
    bic: '',
    bank: '',
    phone: '',
    email: '',
    description:
      'Der Tierschutzverein Darmstadt und Umgebung e.V. vermittelt Heimtiere und betreibt soziale Tierschutzarbeit in Darmstadt. Besuche die Website für aktuelle Spendenmöglichkeiten.',
  },
];

const WAYS = [
  {
    icon: '🍖',
    title: 'Futter & Bedarf',
    text: 'Hundefutter, Leckerlis, Spielzeug, Leinen — täglich werden neue Vorräte benötigt.',
  },
  {
    icon: '🩺',
    title: 'Tierärztliche Kosten',
    text: 'Impfungen, Operationen, Medikamente — gerade Neuzugänge brauchen oft sofortige Versorgung.',
  },
  {
    icon: '🏠',
    title: 'Infrastruktur',
    text: 'Boxen, Zäune, Heizung, Beleuchtung — ein Tierheim braucht kontinuierliche Pflege und Investitionen.',
  },
  {
    icon: '👩‍⚕️',
    title: 'Personal & Ehrenamt',
    text: 'Tierpfleger*innen, Gassigeher*innen, Verwaltung — Spenden sichern Stellen und Aufwandsentschädigungen.',
  },
];

export default function SpendenPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f0f4ff]">
      <Header />

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 45%, #047857 100%)' }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-teal-300/15 blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="text-6xl mb-4 float-anim inline-block">💚</div>
          <h1 className="text-4xl sm:text-6xl font-black text-white mb-4 leading-tight">
            Direkt helfen.<br />
            <span className="text-emerald-300">Direkt spenden.</span>
          </h1>
          <p className="text-emerald-100 text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            Jede Spende geht direkt an die Tierheime — ohne Umwege über PetBridge.
            Futter, Medizin, Pflege: Du siehst, was dein Geld bewirkt.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#tierheime"
              className="px-7 py-3.5 rounded-2xl bg-white text-emerald-700 font-extrabold hover:bg-emerald-50 transition-colors shadow-lg"
            >
              Zu den Bankdaten →
            </a>
            <Link
              href="/hunde"
              className="px-7 py-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/30
                text-white font-semibold hover:bg-white/20 transition-colors"
            >
              Hunde ansehen
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHY DONATE ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">Wofür wird gespendet?</h2>
          <p className="text-slate-500 text-sm max-w-lg mx-auto">
            Tierheime finanzieren sich größtenteils aus Spenden und Mitgliedsbeiträgen.
            Ohne deine Unterstützung wäre die tägliche Arbeit nicht möglich.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {WAYS.map(w => (
            <div key={w.title} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow text-center">
              <div className="text-4xl mb-3">{w.icon}</div>
              <h3 className="font-bold text-slate-900 mb-2 text-sm">{w.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{w.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SHELTER DONATION CARDS ── */}
      <section id="tierheime" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">Alle 4 Tierheime</h2>
          <p className="text-slate-500 text-sm">
            Wähle das Tierheim, das du unterstützen möchtest. Alle Bankdaten direkt zum Kopieren.
          </p>
        </div>

        <div className="space-y-6">
          {SHELTERS.map(s => (
            <div
              key={s.name}
              className={`bg-white rounded-3xl border ${s.border} overflow-hidden shadow-sm hover:shadow-md transition-shadow`}
            >
              {/* Top color bar */}
              <div className={`h-2 bg-gradient-to-r ${s.color}`} />
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Left: info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-2xl shadow-md shrink-0`}>
                        {s.emoji}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-lg">{s.name}</h3>
                        <p className="text-sm text-slate-500">{s.city}</p>
                      </div>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed mb-4">{s.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={s.donateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl
                          bg-gradient-to-r ${s.color} text-white text-sm font-bold shadow-md hover:opacity-90 transition-opacity`}
                      >
                        💚 Online spenden →
                      </a>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200
                          text-slate-600 text-sm font-semibold hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                      >
                        Website →
                      </a>
                    </div>
                  </div>

                  {/* Right: bank details */}
                  {s.iban && (
                    <div className={`rounded-2xl ${s.bg} border ${s.border} p-5 min-w-[260px]`}>
                      <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                        🏦 Bankverbindung
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-slate-500 block">Institut</span>
                          <span className="font-semibold text-slate-800">{s.bank}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">IBAN</span>
                          <span className="font-mono font-bold text-slate-900 tracking-wider">{s.iban}</span>
                        </div>
                        {s.bic && (
                          <div>
                            <span className="text-slate-500 block">BIC</span>
                            <span className="font-mono font-bold text-slate-900">{s.bic}</span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-white/60">
                          <span className="text-slate-500 block">Verwendungszweck</span>
                          <span className="font-semibold text-slate-800">Spende Tierpflege</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact row */}
                {(s.phone || s.email) && (
                  <div className="mt-5 pt-5 border-t border-slate-100 flex flex-wrap gap-4 text-sm text-slate-500">
                    {s.phone && (
                      <a href={`tel:${s.phone.replace(/[\s/]/g, '')}`}
                        className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
                        📞 {s.phone}
                      </a>
                    )}
                    {s.email && (
                      <a href={`mailto:${s.email}?subject=Spendenanfrage`}
                        className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
                        ✉️ {s.email}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PETBRIDGE NOTE ── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 text-center">
        <div className="bg-slate-100 rounded-2xl p-6 border border-slate-200">
          <p className="text-slate-600 text-sm leading-relaxed">
            <strong className="text-slate-900">Hinweis:</strong> PetBridge ist ein unabhängiges, nicht-kommerzielles Projekt.
            Wir sammeln keine Spenden. Alle Beträge gehen direkt an die Tierheime.
            Bei Fragen wende dich bitte direkt an das jeweilige Tierheim.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
