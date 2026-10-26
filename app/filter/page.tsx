// app/filter/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Star, Search, RotateCcw, Filter, Compass } from 'lucide-react';

const GLOBAL_GENRES = [
  'All Genres', 'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 
  'Harem', 'Historical', 'Horror', 'Isekai', 'Martial Arts', 'Mecha', 
  'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life', 
  'Sports', 'Supernatural', 'Thriller', 'Tragedy', 'LitRPG', 'Cultivation',
  'Murim', 'Villainess', 'Reincarnation', 'Cyberpunk', 'Post-Apocalyptic'
];

const FORMATS = [
  { label: 'All Formats', value: 'all' },
  { label: 'Manhwa (KR)', value: 'manhwa' },
  { label: 'Manga (JP)', value: 'manga' },
  { label: 'Manhua (CN)', value: 'manhua' },
  { label: 'Anime', value: 'anime' },
  { label: 'Novels', value: 'novel' },
];

export default function FilterPage() {
  const searchParams = useSearchParams();
  const initialGenre = searchParams.get('genre') || 'All Genres';
  const initialFormat = searchParams.get('format') || 'all';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState(initialFormat);
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function executeFilter() {
      setLoading(true);
      let query = supabase
        .from('media_catalog')
        .select('*')
        .order('score', { ascending: false })
        .limit(40);

      if (searchTerm.trim()) {
        query = query.ilike('title_primary', `%${searchTerm.trim()}%`);
      }

      if (selectedFormat !== 'all') {
        query = query.eq('media_type', selectedFormat);
      }

      if (selectedGenre !== 'All Genres') {
        query = query.contains('genres', [selectedGenre]);
      }

      const { data } = await query;
      setResults(data || []);
      setLoading(false);
    }

    const timer = setTimeout(executeFilter, 200);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedFormat, selectedGenre]);

  const handleReset = () => {
    setSearchTerm('');
    setSelectedFormat('all');
    setSelectedGenre('All Genres');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-24 space-y-7">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2">
            <Filter className="w-5 h-5 text-indigo-400" /> Catalog & Genre Matrix
          </h1>
          <p className="text-xs text-zinc-400">Filter through 2,825 titles by global genre and media format</p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-xs font-bold text-zinc-400 hover:text-white transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Control Surface */}
      <div className="p-4 sm:p-5 rounded-3xl bg-zinc-900/60 border border-white/[0.08] backdrop-blur-xl space-y-4 shadow-xl">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search series title directly..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950/80 border border-white/10 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Formats */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Format:</label>
          <div className="flex flex-wrap gap-1.5">
            {FORMATS.map((f) => (
              <button
                key={f.value}
                onClick={() => setSelectedFormat(f.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedFormat === f.value
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Global Genre Cloud */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Global Genres:</label>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
            {GLOBAL_GENRES.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  selectedGenre === g
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-400 border border-white/5'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-bold">
          <span>Active Results: {results.length} titles</span>
          {selectedGenre !== 'All Genres' && (
            <span className="text-indigo-400">Filtering by "{selectedGenre}"</span>
          )}
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-zinc-500 font-bold uppercase tracking-wider">
            Filtering catalog...
          </div>
        ) : results.length === 0 ? (
          <div className="py-20 text-center text-xs text-zinc-500 border border-dashed border-white/10 rounded-3xl p-6">
            No series match this exact tag combination.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {results.map((item) => (
              <Link key={item.id} href={`/series/${item.id}`} className="group flex flex-col space-y-1.5">
                <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 group-hover:border-indigo-500/60 transition relative shadow-lg">
                  <img src={item.cover_url || '/placeholder.svg'} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                  {item.score && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-[10px] font-black text-amber-300 border border-white/10 flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-400" /> {item.score}
                    </span>
                  )}
                </div>
                <h3 className="text-xs font-bold text-zinc-200 group-hover:text-indigo-400 truncate">
                  {item.title_primary}
                </h3>
                <div className="text-[10px] text-zinc-500 uppercase font-semibold flex items-center gap-1">
                  <span>{item.media_type}</span>
                  <span>•</span>
                  <span>{item.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
