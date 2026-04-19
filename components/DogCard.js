'use client';
import Link from 'next/link';

const STATUS_CONFIG = {
  available: { label: 'Sucht Zuhause',   color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  reserved:  { label: 'Reserviert',       color: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-500' },
  blocked:   { label: 'Interessenten',    color: 'bg-orange-100 text-orange-700',   dot: 'bg-orange-500' },
  foster:    { label: 'Pflegestelle',     color: 'bg-sky-100 text-sky-700',         dot: 'bg-sky-500' },
  sponsor:   { label: 'Pate gesucht',     color: 'bg-violet-100 text-violet-700',   dot: 'bg-violet-500' },
};

export default function DogCard({ dog }) {
  const s = STATUS_CONFIG[dog.status] || STATUS_CONFIG.available;
  const href = `/hund/${dog.id}`;

  const facts = [
    dog.breed      && { icon: '🐕', label: dog.breed },
    dog.ageLabel   && { icon: '📅', label: dog.ageLabel },
    dog.sex        && { icon: dog.sex === 'weiblich' ? '♀️' : '♂️', label: dog.sex + (dog.neuteredStatus ? `, ${dog.neuteredStatus}` : '') },
    dog.size       && { icon: '📏', label: dog.size },
  ].filter(Boolean).slice(0, 4);

  return (
    <Link
      href={href}
      className="dog-card group block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
    >
      {/* ── IMAGE AREA ── */}
      <div className="relative h-56 bg-gradient-to-br from-indigo-50 to-violet-100 overflow-hidden">
        {dog.image ? (
          <img
            src={dog.image}
            alt={dog.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl opacity-20">🐶</div>
        )}

        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Dog name in bottom-left */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <h3 className="font-extrabold text-xl text-white drop-shadow-lg leading-tight">
            {dog.name}
          </h3>
          {/* Ort badge */}
          {dog.shelterCity && (
            <span className="shrink-0 ml-2 flex items-center gap-1 px-2.5 py-1 rounded-full
              bg-white/25 backdrop-blur-sm text-white text-xs font-semibold border border-white/30">
              📍 {dog.shelterCity}
            </span>
          )}
        </div>

        {/* Status badge top-left */}
        <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1
          rounded-full text-xs font-semibold ${s.color} shadow-sm`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot} pulse-dot`} />
          {s.label}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="p-4">
        {/* Shelter name */}
        <p className="text-xs text-indigo-400 font-semibold mb-3 truncate">{dog.shelter}</p>

        {/* Facts grid */}
        {facts.length > 0 && (
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {facts.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-2 py-1.5">
                <span className="text-sm shrink-0">{f.icon}</span>
                <span className="text-xs text-slate-600 truncate font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Description snippet */}
        {dog.description && (
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
            {dog.description}
          </p>
        )}

        {/* CTA footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {dog.postedDate || dog.since || ''}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600
            group-hover:gap-2 transition-all">
            Kennenlernen <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
