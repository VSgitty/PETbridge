'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg group-hover:shadow-indigo-200 transition-shadow">
              <span className="text-white text-lg">🐾</span>
            </div>
            <span className="font-extrabold text-xl text-slate-900 tracking-tight">
              Pet<span className="text-indigo-600">Bridge</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/hunde" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">
              Alle Hunde
            </Link>
            <Link href="/hunde?status=available" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">
              Adoptieren
            </Link>
            <Link href="/hunde?status=sponsor" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">
              Patenschaft
            </Link>
            <Link href="/ueber-uns" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">
              Über PetBridge
            </Link>
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/hunde"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors shadow-md shadow-indigo-200"
            >
              Hund finden
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Menü öffnen"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 py-4 flex flex-col gap-3">
            <Link href="/hunde" onClick={() => setMenuOpen(false)} className="text-slate-700 font-medium py-2 px-2 rounded-lg hover:bg-slate-50">Alle Hunde</Link>
            <Link href="/hunde?status=available" onClick={() => setMenuOpen(false)} className="text-slate-700 font-medium py-2 px-2 rounded-lg hover:bg-slate-50">Adoptieren</Link>
            <Link href="/hunde?status=sponsor" onClick={() => setMenuOpen(false)} className="text-slate-700 font-medium py-2 px-2 rounded-lg hover:bg-slate-50">Patenschaft</Link>
            <Link href="/hunde" onClick={() => setMenuOpen(false)} className="mt-2 text-center px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold">Hund finden</Link>
          </div>
        )}
      </div>
    </header>
  );
}
