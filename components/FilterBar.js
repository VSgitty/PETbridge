'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const SHELTERS = [
  { value: '', label: 'Alle Tierheime' },
  { value: 'Gelnhausen', label: 'Tierheim Gelnhausen' },
  { value: 'Hanau', label: 'Tierschutz Hanau' },
  { value: 'Babenhausen', label: 'Tierheim Babenhausen' },
  { value: 'Darmstadt', label: 'TSV Darmstadt' },
];

const GENDERS = [
  { value: '', label: 'Alle' },
  { value: 'männlich', label: 'Rüde (männlich)' },
  { value: 'weiblich', label: 'Hündin (weiblich)' },
];

const SIZES = [
  { value: '', label: 'Alle Größen' },
  { value: 'Klein', label: 'Klein (bis 35 cm)' },
  { value: 'Mittel', label: 'Mittel (35–50 cm)' },
  { value: 'Groß', label: 'Groß (50–65 cm)' },
  { value: 'Sehr groß', label: 'Sehr groß (65+ cm)' },
];

const STATUSES = [
  { value: '', label: 'Alle Status' },
  { value: 'available', label: '🟢 Sucht Zuhause' },
  { value: 'sponsor', label: '🟣 Pate gesucht' },
  { value: 'foster', label: '🔵 Pflegestelle' },
  { value: 'reserved', label: '🟡 Reserviert' },
];

const SORTS = [
  { value: 'newest', label: 'Neueste zuerst' },
  { value: 'oldest', label: 'Wartet am längsten' },
  { value: 'az', label: 'A → Z' },
];

export default function FilterBar({ filters, onChange, total }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6">
      {/* Search row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Name oder Rasse suchen…"
            value={filters.search || ''}
            onChange={e => handleChange('search', e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-sm"
          />
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">📍</span>
          <select
            value={filters.shelter || ''}
            onChange={e => handleChange('shelter', e.target.value)}
            className="pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm appearance-none cursor-pointer min-w-[200px]"
          >
            {SHELTERS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <select
          value={filters.sort || 'newest'}
          onChange={e => handleChange('sort', e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm appearance-none cursor-pointer"
        >
          {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Status chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {STATUSES.map(s => (
          <button
            key={s.value}
            onClick={() => handleChange('status', s.value === filters.status ? '' : s.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filters.status === s.value
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Advanced toggle */}
      <button
        onClick={() => setShowAdvanced(v => !v)}
        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
      >
        {showAdvanced ? '▲' : '▼'} Erweiterte Filter
      </button>

      {showAdvanced && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-3">
          <select
            value={filters.sex || ''}
            onChange={e => handleChange('sex', e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm appearance-none cursor-pointer"
          >
            {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
          <select
            value={filters.size || ''}
            onChange={e => handleChange('size', e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm appearance-none cursor-pointer"
          >
            {SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          {(filters.search || filters.shelter || filters.status || filters.sex || filters.size) && (
            <button
              onClick={() => onChange({ sort: filters.sort })}
              className="px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors"
            >
              ✕ Filter zurücksetzen
            </button>
          )}
        </div>
      )}

      {/* Result count */}
      <div className="mt-3 text-xs text-slate-500">
        <span className="font-semibold text-slate-700">{total}</span> Hunde gefunden
      </div>
    </div>
  );
}
