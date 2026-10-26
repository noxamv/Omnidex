// app/filter/page.tsx
'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Star, Search, RotateCcw, Filter, ChevronDown } from 'lucide-react';

const GLOBAL_GENRES = [
  'All Genres', 'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy',
  'Isekai', 'Martial Arts', 'Murim', 'Cultivation', 'LitRPG', 'System',
  'Reincarnation', 'Villainess', 'Supernatural', 'Magic', 'Mystery',
  'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports',
  'Thriller', 'Horror', 'Tragedy', 'Historical', 'School Life',
  'Shounen', 'Seinen', 'Shoujo', 'Josei', 'Mecha', 'Cyberpunk',
  'Post-Apocalyptic', 'Urban Fantasy', 'Monsters', 'Monster Girls',
  'Harem', 'Demons', 'Vampires', 'Game', 'Military', 'Time Travel',
  'Super Power', 'Survival'
];

function FilterContent() {
  const searchParams = useSearchParams();
  const initialGenre = searchParams.get('genre') || 'All Genres';
  const initialFormat = searchParams.get('format') || 'all';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState(initialFormat);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSort, setSelectedSort] = useState('score');
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function executeFilter() {
      setLoading(true);
      let query = supabase.from('media_catalog').select('*').limit(60);

      // Sorting
      if (selectedSort === 'score') {
        query = query.order('score', { ascending: false, nullsFirst: false });
      } else if (selectedSort === 'title') {
        query = query.order('title_primary', { ascending: true });
      } else if (selectedSort === 'chapters') {
        query = query.order('total_units', { ascending: false });
      }

      // Title Search
      if (searchTerm.trim()) {
        query = query.ilike('title_primary', `%${searchTerm.trim()}%`);
      }

      // Media Format
      if (selectedFormat !== 'all') {
        query = query.eq('media_type', selectedFormat);
      }

      // Release Status
      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      // Genre
      if (selectedGenre !== 'All Genres') {
        query = query.contains('genres', [selectedGenre]);
      }

      const { data } = await query;
      setResults(data || []);
      setLoading(false);
    }

    const timer = setTimeout(executeFilter, 200);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedFormat, selectedStatus, selectedSort, selectedGenre]);

  const handleReset = () => {
    setSearchTerm('');
    setSelectedFormat('all');
    setSelectedStatus('all');
    setSelectedSort('score');
    setSelectedGenre('All Genres');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2">
            <Filter className="w-5 h-5 text-indigo-400" /> Browse & Filter
          </h1>
          <p className="text-xs text-zinc-400">Explore catalog using filters and global genres</p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-xs font-bold text-zinc-400 hover:text-white transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>

      {/* MangaFlow Filter Bar Surface */}
      <div className="p-4 sm:p-5 rounded-3xl bg-zinc-900/60 border border-white/[0.08] backdrop-blur-xl space-y-4 shadow-xl">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search titles..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950/80 border border-white/10 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* 3 Select Dropdowns: Type, Status, Sort By */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Type:</label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-xs text-zinc-200 font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="manhwa">Manhwa (Webtoon)</option>
              <option value="manga">Manga (Japan)</option>
              <option value="manhua">Manhua (China)</option>
              <option value="anime">Anime Series</option>
              <option value="novel">Web & Light Novels</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Status:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-xs text-zinc-200 font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="releasing">Releasing / Ongoing</option>
              <option value="finished">Completed / Finished</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Sort By:</label>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-xs text-zinc-200 font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="score">Highest Rated</option>
              <option value="chapters">Total Units (Chapters/Episodes)</option>
              <option value="title">A to Z</option>
            </select>
          </div>
        </div>

        {/* Global Genre Matrix */}
        <div className="space-y-1.5 pt-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
            Genres ({GLOBAL_GENRES.length - 1}):
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
            {GLOBAL_GENRES.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  selectedGenre === g
                    ? 'bg-amber-500 text-black font-black shadow-sm'
                    : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-400 border border-white/5'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-bold">
          <span>{results.length} titles found</span>
          {selectedGenre !== 'All Genres' && (
            <span className="text-amber-400">Tag: {selectedGenre}</span>
          )}
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-zinc-500 font-bold uppercase tracking-wider">
            Filtering catalog...
          </div>
        ) : results.length === 0 ? (
          <div className="py-20 text-center text-xs text-zinc-500 border border-dashed border-white/10 rounded-3xl p-6">
            No series match this combination.
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
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 text-center text-xs text-zinc-500 font-bold uppercase tracking-wider">
          Loading filter catalog...
        </div>
      }
    >
      <FilterContent />
    </Suspense>
  );
}
