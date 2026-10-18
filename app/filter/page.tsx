'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { Star, Search, RotateCcw } from 'lucide-react';

const GENRES = [
  'All Genres', 'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 
  'Harem', 'Historical', 'Horror', 'Isekai', 'Martial Arts', 'Mecha', 
  'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life', 
  'Sports', 'Supernatural', 'Thriller', 'Tragedy', 'LitRPG', 'Cultivation'
];

export default function FilterPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [minCount, setMinCount] = useState<number>(0);
  const [selectedGenre, setSelectedGenre] = useState('All Genres');

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function executeFilter() {
      setLoading(true);
      let query = supabase.from('media_catalog').select('*').order('score', { ascending: false });

      if (searchTerm.trim()) {
        query = query.ilike('title_primary', `%${searchTerm.trim()}%`);
      }

      if (selectedFormat !== 'all') {
        query = query.eq('media_type', selectedFormat);
      }

      if (minCount > 0) {
        query = query.gte('total_units', minCount);
      }

      if (selectedGenre !== 'All Genres') {
        query = query.contains('genres', [selectedGenre]);
      }

      const { data } = await query.limit(60);
      setResults(data || []);
      setLoading(false);
    }

    const debounce = setTimeout(executeFilter, 250);
    return () => clearTimeout(debounce);
  }, [searchTerm, selectedFormat, minCount, selectedGenre]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedFormat('all');
    setMinCount(0);
    setSelectedGenre('All Genres');
  };

  const isAnime = selectedFormat === 'anime';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-20">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg sm:text-xl font-black text-white">Browse & Filter Catalog</h1>
        <button
          onClick={resetFilters}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-indigo-400 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Main Filter Control Box */}
      <div className="bg-[#0e121b] border border-slate-800/80 rounded-2xl p-4 sm:p-5 mb-6 space-y-4 shadow-xl">
        
        {/* 1. Search Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Search Title</label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Type series name..."
              className="w-full bg-[#111622] border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* 2. Format / Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Format / Type</label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: 'All Types', value: 'all' },
              { label: 'Anime', value: 'anime' },
              { label: 'Manga (Japan)', value: 'manga' },
              { label: 'Manhwa (Korea)', value: 'manhwa' },
              { label: 'Manhua (China)', value: 'manhua' },
              { label: 'Web / Light Novels', value: 'novel' },
            ].map((fmt) => (
              <button
                key={fmt.value}
                onClick={() => {
                  setSelectedFormat(fmt.value);
                  setMinCount(0);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedFormat === fmt.value
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'bg-[#111622] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {fmt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Dynamic Episode / Chapter Options */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
            {isAnime ? 'Min Episodes / Seasons' : 'Min Chapters'}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {isAnime ? (
              [
                { label: 'Any', value: 0 },
                { label: '1+ Ep', value: 1 },
                { label: '12+ Eps (1 Cour)', value: 12 },
                { label: '24+ Eps (2 Cour)', value: 24 },
                { label: '50+ Eps', value: 50 },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setMinCount(opt.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    minCount === opt.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-[#111622] text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))
            ) : (
              [
                { label: 'Any', value: 0 },
                { label: '10+ Chapters', value: 10 },
                { label: '50+ Chapters', value: 50 },
                { label: '100+ Chapters', value: 100 },
                { label: '200+ Chapters', value: 200 },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setMinCount(opt.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    minCount === opt.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-[#111622] text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>

        {/* 4. Genres */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Genre</label>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
            {GENRES.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  selectedGenre === g
                    ? 'bg-indigo-600 text-white'
                    : 'bg-[#111622] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Results Grid */}
      <div>
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 px-1">
          Results ({results.length})
        </h2>

        {loading ? (
          <div className="text-center py-20 text-slate-500 text-xs">Filtering series...</div>
        ) : results.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl">
            <p className="text-slate-400 text-sm">No series match this filter criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {results.map((item) => (
              <Link key={item.id} href={`/series/${item.id}`} className="flex flex-col group">
                <div className="w-full aspect-[2/3] relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 group-hover:border-indigo-500/60 transition shadow-md">
                  <img
                    src={item.cover_url || '/placeholder.png'}
                    alt={item.title_primary}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                    loading="lazy"
                  />
                  {item.score && (
                    <span className="absolute top-1 right-1 bg-black/85 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-bold text-amber-400 flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-400" /> {item.score}
                    </span>
                  )}
                  <span className="absolute bottom-1 left-1 bg-[#0a0d14]/90 px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-indigo-300">
                    {item.media_type}
                  </span>
                </div>
                <h3 className="mt-1.5 font-bold text-xs leading-snug line-clamp-2 text-slate-200 group-hover:text-indigo-400 transition">
                  {item.title_primary}
                </h3>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
