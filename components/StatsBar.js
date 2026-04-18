export default function StatsBar({ dogs, scrapedAt }) {
  const total = dogs.length;
  const available = dogs.filter(d => d.status === 'available').length;
  const shelters = [...new Set(dogs.map(d => d.shelterCity).filter(Boolean))].length;
  const withImages = dogs.filter(d => d.image).length;

  const lastUpdate = scrapedAt
    ? new Date(scrapedAt).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'wird geladen…';

  const stats = [
    { value: total, label: 'Hunde gesamt', icon: '🐕', color: 'from-indigo-500 to-violet-600' },
    { value: available, label: 'suchen Zuhause', icon: '🏠', color: 'from-emerald-500 to-teal-600' },
    { value: shelters, label: 'Tierheime', icon: '📍', color: 'from-amber-500 to-orange-600' },
    { value: withImages, label: 'mit Foto', icon: '📸', color: 'from-rose-500 to-pink-600' },
  ];

  return (
    <section className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(s => (
            <div key={s.label} className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-xl shadow-sm shrink-0`}>
                {s.icon}
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900">{s.value}</div>
                <div className="text-xs text-slate-500 font-medium">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-4 flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
          Zuletzt aktualisiert: {lastUpdate}
        </p>
      </div>
    </section>
  );
}
