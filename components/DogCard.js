'use client';
import Link from 'next/link';

const STATUS_CONFIG = {
  available: { label: 'Sucht Zuhause', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  reserved:  { label: 'Reserviert',    color: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-500' },
  blocked:   { label: 'Interessenten', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  foster:    { label: 'Pflegestelle',  color: 'bg-sky-100 text-sky-700',       dot: 'bg-sky-500' },
  sponsor:   { label: 'Pate gesucht',  color: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
};

export default function DogCard({ dog }) {
  const s = STATUS_CONFIG[dog.status] || STATUS_CONFIG.available;
  const href = `/hund/${dog.id}`;

  const facts = [
    dog.breed      && { icon: '🐕', label: dog.breed },
    dog.ageLabel   && { icon: '📅', label: dog.ageLabel },
    (dog.sex || dog.neuteredStatus) && { icon: '⚥', label: [dog.sex, dog.neuteredStatus].filter(Boolean).join(', ') },
    dog.size       && { icon: '📏', label: dog.size },
    dog.shelterCity && { icon: '📍', label: dog.shelterCity },
  ].filter(Boolean).slice(0, 4);

  return (
    <Link href={href} className="group dog-card block bg-white rounded-2xl shadow-md overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">
      {/* Image */}
      <div className="relative h-52 bg-gradient-to-br from-indigo-50 to-violet-50 overflow-hidden">
        {dog.image ? (
          <img
            src={dog.image}
            alt={dog.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl opacity-30">🐶</div>
        )}

        {/* Status badge */}
        <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.color} shadow-sm`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot} pulse-dot`} />
          {s.label}
        </div>

        {/* Shelter badge */}
        <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs font-medium">
          {dog.shelterCity}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
            {dog.name}
          </h3>
          <span className="text-indigo-600 text-sm font-medium shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
            Mehr →
          </span>
        </div>

        {/* Shelter */}
        <p className="text-xs text-slate-500 mb-3 truncate">{dog.shelter}</p>

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
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {dog.description}
          </p>
        )}

        {/* CTA */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">{dog.postedDate || dog.since || ''}</span>
          <span className="text-xs font-semibold text-indigo-600 group-hover:underline">
            Kennenlernen →
          </span>
        </div>
      </div>
    </Link>
  );
}
