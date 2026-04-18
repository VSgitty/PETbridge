'use client';

export function DogImage({ src, alt }) {
  if (!src) {
    return (
      <div className="w-full h-full flex items-center justify-center text-8xl opacity-20">🐶</div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      onError={e => { e.target.style.display = 'none'; }}
    />
  );
}

export function DogThumbnail({ src, alt }) {
  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover hover:opacity-80 transition-opacity cursor-pointer"
      onError={e => { e.target.style.display = 'none'; }}
    />
  );
}
