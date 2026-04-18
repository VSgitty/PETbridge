import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { readCache } from '@/lib/cache';
import { fetchGelnhausenDetail } from '@/lib/scrapers/gelnhausen';
import { notFound } from 'next/navigation';

export const revalidate = 3600;

async function getDogById(id) {
  const { dogs } = await readCache();
  return dogs.find(d => d.id === id) || null;
}

const STATUS_LABELS = {
  available: { label: 'Sucht ein Zuhause', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  reserved:  { label: 'Reserviert', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  blocked:   { label: 'Interessenten vorhanden', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  foster:    { label: 'Auf Pflegestelle', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  sponsor:   { label: 'Pate gesucht', color: 'bg-violet-100 text-violet-700 border-violet-200' },
};

export default async function DogDetailPage({ params }) {
  const { id } = params;
  let dog = await getDogById(id);
  if (!dog) notFound();

  // If Gelnhausen dog with minimal info, fetch detail page
  if (dog.shelter === 'Tierheim Gelnhausen' && dog.profileUrl && !dog.breed) {
    const detail = await fetchGelnhausenDetail(dog.profileUrl);
    if (detail) dog = { ...dog, ...detail };
  }

  const s = STATUS_LABELS[dog.status] || STATUS_LABELS.available;
  const allImages = dog.images?.length > 0 ? dog.images : (dog.image ? [dog.image] : []);

  const facts = [
    { label: 'Rasse', value: dog.breed, icon: '🐕' },
    { label: 'Geburtsjahr', value: dog.birthText, icon: '📅' },
    { label: 'Alter', value: dog.ageLabel, icon: '🎂' },
    { label: 'Geschlecht', value: [dog.sex, dog.neuteredStatus].filter(Boolean).join(', '), icon: '⚥' },
    { label: 'Größe', value: dog.size || (dog.height ? `${dog.height}` : ''), icon: '📏' },
    { label: 'Gewicht', value: dog.weight, icon: '⚖️' },
    { label: 'Farbe', value: dog.color, icon: '🎨' },
    { label: 'Im Tierheim seit', value: dog.since, icon: '🏠' },
  ].filter(f => f.value);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-indigo-600">Start</Link>
          <span>›</span>
          <Link href="/hunde" className="hover:text-indigo-600">Alle Hunde</Link>
          <span>›</span>
          <span className="text-slate-900 font-medium">{dog.name}</span>
        </div>
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Left: Images */}
          <div className="lg:col-span-3 space-y-4">
            {/* Main image */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-50 to-violet-50 aspect-[4/3] shadow-xl">
              {allImages.length > 0 ? (
                <img
                  src={allImages[0]}
                  alt={dog.name}
                  className="w-full h-full object-cover"
                  onError={e => { e.target.style.display='none'; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl opacity-20">🐶</div>
              )}

              {/* Status overlay */}
              <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full border text-sm font-semibold ${s.color}`}>
                {s.label}
              </div>
            </div>

            {/* Thumbnail strip */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {allImages.slice(1, 5).map((img, i) => (
                  <div key={i} className="rounded-xl overflow-hidden aspect-square bg-slate-100">
                    <img
                      src={img}
                      alt={`${dog.name} Foto ${i + 2}`}
                      className="w-full h-full object-cover hover:opacity-80 transition-opacity cursor-pointer"
                      onError={e => { e.target.style.display='none'; }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            {dog.description && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="font-bold text-lg text-slate-900 mb-3">Über {dog.name}</h2>
                <div className="text-slate-600 leading-relaxed whitespace-pre-line text-sm">
                  {dog.description}
                </div>
              </div>
            )}
          </div>

          {/* Right: Info + Actions */}
          <div className="lg:col-span-2 space-y-4">
            {/* Name card */}
            <div className="bg-white rounded-2xl border-2 border-indigo-100 p-6 shadow-sm">
              <h1 className="text-4xl font-extrabold text-slate-900 mb-1">{dog.name}</h1>
              <p className="text-indigo-600 font-medium">{dog.shelter}</p>
              <p className="text-slate-500 text-sm flex items-center gap-1 mt-1">
                <span>📍</span> {dog.shelterCity}
              </p>
            </div>

            {/* Facts */}
            {facts.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h2 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wide">Steckbrief</h2>
                <div className="space-y-2">
                  {facts.map(f => (
                    <div key={f.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <span className="flex items-center gap-2 text-sm text-slate-500">
                        <span>{f.icon}</span>
                        {f.label}
                      </span>
                      <span className="text-sm font-semibold text-slate-800 text-right max-w-[55%]">{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shelter contact */}
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-5 text-white shadow-lg">
              <h2 className="font-bold mb-3">Kontakt aufnehmen</h2>
              <p className="text-indigo-200 text-sm mb-4">
                Interesse? Melde dich direkt beim Tierheim. Wir freuen uns über jeden Anruf!
              </p>
              {dog.shelterPhone && (
                <a
                  href={`tel:${dog.shelterPhone.replace(/\s/g, '')}`}
                  className="flex items-center gap-2 w-full py-2.5 px-4 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-sm mb-2 transition-colors"
                >
                  📞 {dog.shelterPhone}
                </a>
              )}
              {dog.shelterEmail && (
                <a
                  href={`mailto:${dog.shelterEmail}?subject=Anfrage zu ${dog.name}&body=Hallo, ich interessiere mich für ${dog.name} (PetBridge ID: ${dog.id}).`}
                  className="flex items-center gap-2 w-full py-2.5 px-4 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-sm mb-2 transition-colors"
                >
                  ✉️ E-Mail schreiben
                </a>
              )}
              {dog.profileUrl && (
                <a
                  href={dog.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 w-full py-2.5 px-4 rounded-xl bg-white text-indigo-700 font-bold text-sm hover:bg-indigo-50 transition-colors"
                >
                  🌐 Zum Tierheim-Profil →
                </a>
              )}
            </div>

            {/* Back */}
            <Link
              href="/hunde"
              className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors"
            >
              ← Zurück zur Übersicht
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
