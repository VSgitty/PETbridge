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
      className="dog-card group block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
    >
      {/* ── IMAGE AREA ── */}
      <div className="relative h-36 sm:h-44 bg-gradient-to-br from-indigo-50 to-violet-100 overflow-hidden">
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
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-20">🐶</div>
        )}

        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Dog name in bottom-left */}
        <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
          <h3 className="font-extrabold text-sm sm:text-base text-white drop-shadow-lg leading-tight">
            {dog.name}
          </h3>
          {/* Ort badge */}
          {dog.shelterCity && (
            <span className="shrink-0 ml-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full
              bg-white/25 backdrop-blur-sm text-white text-[10px] font-semibold border border-white/30">
              📍 {dog.shelterCity}
            </span>
          )}
        </div>

        {/* Status badge top-left */}
        <div className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5
          rounded-full text-[10px] font-semibold ${s.color} shadow-sm`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot} pulse-dot`} />
          {s.label}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="p-2.5">
        {/* Shelter name */}
        <p className="text-[10px] text-indigo-400 font-semibold mb-1.5 truncate">{dog.shelter}</p>

        {/* Facts: max 2 on mobile, up to 4 otherwise */}
        {facts.length > 0 && (
          <div className="grid grid-cols-2 gap-1 mb-2">
            {facts.slice(0, 2).map((f, i) => (
              <div key={i} className="flex items-center gap-1 bg-slate-50 rounded-md px-1.5 py-1">
                <span className="text-xs shrink-0">{f.icon}</span>
                <span className="text-[10px] text-slate-600 truncate font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* CTA footer */}
        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-end">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600
            group-hover:gap-1.5 transition-all">
            Profil <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
