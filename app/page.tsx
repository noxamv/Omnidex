import Link from 'next/link';
import { supabase } from '../lib/supabase';
import Spotlight from '../components/Spotlight';
import { Star, ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  searchParams: {
    type?: string;
    search?: string;
  };
}

export default async function HomePage({ searchParams }: PageProps) {
  const selectedType = (searchParams?.type || 'all').toLowerCase();
  const rawSearch = (searchParams?.search || '').trim();
  const sanitizedSearch = rawSearch.replace(/[%_]/g, '');

  let query = supabase
    .from('media_catalog')
    .select('*')
    .order('score', { ascending: false })
    .limit(100);

  if (selectedType !== 'all') {
    query = query.eq('media_type', selectedType);
  }

  if (sanitizedSearch) {
    query = query.ilike('title_primary', `%${sanitizedSearch}%`);
  }

  const { data: catalog } = await query;
  const items = catalog || [];

  const spotlightItem = !sanitizedSearch && items.length > 0 ? items[0] : null;

  // Shelves corresponding to categories
  const trendingNow = items.slice(0, 15);
  const manhwaShelf = items.filter((i) => i.media_type === 'manhwa');
  const novelShelf = items.filter((i) => i.media_type === 'novel');
  const animeShelf = items.filter((i) => i.media_type === 'anime');
  const mangaShelf = items.filter((i) => i.media_type === 'manga');

  const categories = [
    { label: 'All Media', value: 'all' },
    { label: 'Novels', value: 'novel' },
    { label: 'Manhwa', value: 'manhwa' },
    { label: 'Anime', value: 'anime' },
    { label: 'Manga', value: 'manga' },
  ];

  const renderHorizontalShelf = (title: string, list: any[], filterType?: string) => {
    if (list.length === 0) return null;

    return (
      <section className="mb-7">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
            <span className="w-1.5 h-3.5 bg-indigo-500 rounded-full" />
            <span>{title}</span>
          </h2>
          {filterType && (
            <Link
              href={`/?type=${filterType}`}
              className="text-xs font-bold text-slate-400 hover:text-indigo-400 flex items-center gap-0.5 transition"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Clean MangaFlow-Style Horizontal Shelf */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
          {list.map((item) => (
            <Link
              key={item.id}
              href={`/series/${item.id}`}
              className="w-28 sm:w-36 flex-shrink-0 snap-start flex flex-col group cursor-pointer"
            >
              {/* Clean 2:3 Cover Poster */}
              <div className="w-full aspect-[2/3] relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 group-hover:border-indigo-500/60 transition duration-300 shadow-md">
                <img
                  src={item.cover_url || '/placeholder.png'}
                  alt={item.title_primary}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  loading="lazy"
                />

                {item.score && (
                  <span className="absolute top-1.5 right-1.5 bg-black/85 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-black text-amber-400 flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-amber-400" /> {item.score}
                  </span>
                )}

                <span className="absolute bottom-1.5 left-1.5 bg-[#0a0d14]/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-indigo-300">
                  {item.media_type}
                </span>
              </div>

              {/* Clean Title Only - No Buttons */}
              <div className="mt-2 px-0.5">
                <h3 className="font-bold text-xs leading-snug line-clamp-2 text-slate-200 group-hover:text-indigo-400 transition">
                  {item.title_primary}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3">
      {/* 1. MangaFlow Spotlight Hero */}
      {spotlightItem && <Spotlight item={spotlightItem} />}

      {/* 2. Category Navigation */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2 mb-6">
        {categories.map((cat) => (
          <Link
            key={cat.value}
            href={`/?type=${cat.value}${sanitizedSearch ? `&search=${encodeURIComponent(sanitizedSearch)}` : ''}`}
            prefetch={false}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
              selectedType === cat.value
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-[#111622] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat.label}
          </Link>
        ))}
      </div>

      {/* 3. Catalog Shelves or Search Grid */}
      {items.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-slate-800 rounded-2xl bg-[#0e131d]/30">
          <p className="text-slate-400 text-sm font-medium">No series match this query.</p>
        </div>
      ) : sanitizedSearch || selectedType !== 'all' ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {items.map((item) => (
            <Link key={item.id} href={`/series/${item.id}`} className="flex flex-col group">
              <div className="w-full aspect-[2/3] relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 group-hover:border-indigo-500/60 transition duration-300">
                <img
                  src={item.cover_url || '/placeholder.png'}
                  alt={item.title_primary}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  loading="lazy"
                />
                {item.score && (
                  <span className="absolute top-1 right-1 bg-black/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-bold text-amber-400 flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-amber-400" /> {item.score}
                  </span>
                )}
              </div>
              <h3 className="mt-2 font-bold text-xs leading-snug line-clamp-2 text-slate-200 group-hover:text-indigo-400 transition">
                {item.title_primary}
              </h3>
            </Link>
          ))}
        </div>
      ) : (
        <div>
          {renderHorizontalShelf('Trending Series', trendingNow)}
          {renderHorizontalShelf('Popular Novels (Web & Light)', novelShelf, 'novel')}
          {renderHorizontalShelf('Trending Manhwa & Webtoons', manhwaShelf, 'manhwa')}
          {renderHorizontalShelf('Trending Anime', animeShelf, 'anime')}
          {renderHorizontalShelf('Popular Manga', mangaShelf, 'manga')}
        </div>
      )}
    </div>
  );
}
