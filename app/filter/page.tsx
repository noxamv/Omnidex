// app/filter/page.tsx
'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Star, Search, RotateCcw, Filter, X } from 'lucide-react';

const GENRE_LIST = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy',
  'Isekai', 'Martial Arts', 'Murim', 'Cultivation', 'LitRPG', 'System',
  'Reincarnation', 'Villainess', 'Supernatural', 'Magic', 'Mystery',
  'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports',
  'Thriller', 'Horror', 'Tragedy', 'Historical', 'School Life',
  'Shounen', 'Seinen', 'Shoujo', 'Josei', 'Mecha', 'Cyberpunk',
  'Post-Apocalyptic', 'Urban Fantasy', 'Monsters', 'Harem', 'Game'
];

function FilterContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || 'all';
  const initialSort = searchParams.get('sort') || 'score';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState(initialType);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSort, setSelectedSort] = useState(initialSort);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Toggle genre selection up to 3 tags
  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) => {
      if (prev.includes(genre)) return prev.filter((g) => g !== genre);
      if (prev.length >= 3) return [...prev.slice(1), genre];
      return [...prev, genre];
    });
  };

  useEffect(() => {
    async function executeFilter() {
      setLoading(true);

      // Multi-genre query using Postgres RPC function
      if (selectedGenres.length > 0) {
        const { data, error } = await supabase.rpc('filter_media_by_genres', {
          p_genres: selectedGenres,
          p_type: selectedType,
          p_status: selectedStatus,
          p_sort: selectedSort,
          p_limit: 80
        });

        let filtered = data || [];
        if (searchTerm.trim()) {
          filtered = filtered.filter((item: any) => 
            item.title_primary.toLowerCase().includes(searchTerm.toLowerCase().trim())
          );
        }
        setResults(filtered);
      } else {
        let query = supabase.from('media_catalog').select('*').limit(80);

        if (selectedSort === 'score') query = query.order('score', { ascending: false, nullsFirst: false });
        else if (selectedSort === 'title') query = query.order('title_primary', { ascending: true });
        else if (selectedSort === 'latest') query = query.order('updated_at', { ascending: false });

        if (searchTerm.trim()) query = query.ilike('title_primary', `%${searchTerm.trim()}%`);
        if (selectedType !== 'all') query = query.eq('media_type', selectedType);
        if (selectedStatus !== 'all') query = query.eq('status', selectedStatus);

        const { data } = await query;
        setResults(data || []);
      }

      setLoading(false);
    }

    const timer = setTimeout(executeFilter, 180);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedType, selectedStatus, selectedSort, selectedGenres]);

  const handleReset = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedStatus('all');
    setSelectedSort('score');
    setSelectedGenres([]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-24 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Filter className="w-5 h-5 text-indigo-400" /> Filter Directory
          </h1>
          <p className="text-xs text-zinc-400">Search titles across all verified categories and tags</p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-xs font-bold text-zinc-400 hover:text-white transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* MangaFire Compact 2-Column Filter Matrix */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/[0.08] backdrop-blur-xl space-y-3.5 shadow-xl">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search series titles..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-950 border border-white/10 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Compact 3 Select Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">TYPE:</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-zinc-950 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Any Type</option>
              <option value="manhwa">Manhwa (Korea)</option>
              <option value="manga">Manga (Japan)</option>
              <option value="manhua">Manhua (China)</option>
              <option value="anime">Anime Series</option>
              <option value="novel">Web & Light Novels</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">STATUS:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-zinc-950 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Any Status</option>
              <option value="releasing">Releasing / Ongoing</option>
              <option value="finished">Completed / Finished</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">SORT BY:</label>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="w-full bg-zinc-950 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="score">Highest Rated</option>
              <option value="latest">Latest Updated</option>
              <option value="title">A to Z</option>
            </select>
          </div>
        </div>

        {/* Multi-Genre Cloud (Select up to 3) */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase text-zinc-400">
              Select Genres (Up to 3):
            </label>
            {selectedGenres.length > 0 && (
              <span className="text-[10px] font-bold text-amber-400">
                {selectedGenres.length}/3 Selected
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
            {GENRE_LIST.map((g) => {
              const isSelected = selectedGenres.includes(g);
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGenre(g)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                    isSelected
                      ? 'bg-amber-500 text-black font-black shadow-sm'
                      : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-400 border border-white/5'
                  }`}
                >
                  <span>{g}</span>
                  {isSelected && <X className="w-2.5 h-2.5" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-bold">
          <span>{results.length} titles matched</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-zinc-500 font-bold uppercase tracking-wider">
            Filtering catalog...
          </div>
        ) : results.length === 0 ? (
          <div className="py-20 text-center text-xs text-zinc-500 border border-dashed border-white/10 rounded-3xl p-6">
            No series match this combination. Try clearing some genre tags.
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

export default function FilterPage() {
  return (
    <Suspense fallback={<div className="pt-20 text-center text-xs text-zinc-500">Loading catalog filter...</div>}>
      <FilterContent />
    </Suspense>
  );
}
