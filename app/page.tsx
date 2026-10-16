import Link from 'next/link';
import { supabase } from '../lib/supabase';
import Spotlight from '../components/Spotlight';
import ShareBar from '../components/ShareBar';
import { ExternalLink, Star, ChevronRight } from 'lucide-react';

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

  // Shelves aligned with AniList classifications
  const trendingNow = items.slice(0, 15);
  const popularSeason = items.filter((i) => i.score && i.score >= 7.8).slice(0, 15);
  const manhwaShelf = items.filter((i) => i.media_type === 'manhwa');
  const animeShelf = items.filter((i) => i.media_type === 'anime');
  const mangaShelf = items.filter((i) => i.media_type === 'manga');
  const novelShelf = items.filter((i) => i.media_type === 'novel');

  const categories = [
    { label: 'All Media', value: 'all' },
    { label: 'Anime', value: 'anime' },
    { label: 'Manhwa', value: 'manhwa' },
    { label: 'Manga', value: 'manga' },
    { label: 'Novels', value: 'novel' },
  ];

  const renderHorizontalShelf = (title: string, list: any[], filterType?: string) => {
    if (list.length === 0) return null;

    return (
      <section className="mb-7">
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <h2 className="text-xs sm:text-sm font-black tracking-wider uppercase text-slate-200">
            {title}
          </h2>
          {filterType && (
            <Link
              href={`/?type=${filterType}`}
              className="text-[11px] font-bold text-slate-500 hover:text-indigo-400 flex items-center gap-0.5 transition"
            >
              <span>View All</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {/* Clean AniList-Style Horizontal Scroll Rail */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
          {list.map((item, idx) => {
            const officialSources = (item.official_links as any[]) || [];
            const primarySource = officialSources[0];

            return (
              <div
                key={item.id}
                className="w-28 sm:w-36 flex-shrink-0 snap-start flex flex-col group cursor-pointer"
              >
                {/* Standard 2:3 Cover Poster without partial cutouts */}
                <div className="w-full aspect-[2/3] relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800/80 group-hover:border-indigo-500/50 transition duration-300 shadow-md">
                  <img
                    src={item.cover_url || '/placeholder.png'}
                    alt={item.title_primary}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />

                  {/* Rank badge for Trending / Score Badge */}
                  {item.score ? (
                    <span className="absolute top-1.5 right-1.5 bg-black/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-black text-amber-400 flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-400" /> {item.score}
                    </span>
                  ) : null}

                  <span className="absolute bottom-1.5 left-1.5 bg-[#0a0d14]/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase text-indigo-300">
                    {item.media_type}
                  </span>
                </div>

                {/* Title & Outbound Action */}
                <div className="mt-2 space-y-1">
                  <h3 className="font-bold text-[11px] sm:text-xs leading-snug line-clamp-2 text-slate-200 group-hover:text-indigo-400 transition">
                    {item.title_primary}
                  </h3>

                  <div className="flex items-center gap-1 pt-0.5">
                    {primarySource ? (
                      <a
                        href={`/api/track?mediaId=${encodeURIComponent(item.id)}&target=${encodeURIComponent(primarySource.url)}&step=1`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center text-[9px] py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded font-bold transition flex items-center justify-center gap-0.5"
                      >
                        <span className="truncate">{primarySource.site}</span>
                        <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                      </a>
                    ) : (
                      <span className="flex-1 text-center text-[9px] py-1 text-slate-600 bg-slate-900 rounded font-medium">
                        Indexed
                      </span>
                    )}

                    <ShareBar title={item.title_primary} slug={item.slug} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3">
      {/* 1. 16:10 Hero Spotlight */}
      {spotlightItem && <Spotlight item={spotlightItem} />}

      {/* 2. MangaFire Minimal Category Pill Filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2 mb-5">
        {categories.map((cat) => (
          <Link
            key={cat.value}
            href={`/?type=${cat.value}${sanitizedSearch ? `&search=${encodeURIComponent(sanitizedSearch)}` : ''}`}
            prefetch={false}
            className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap ${
              selectedType === cat.value
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'bg-[#111622] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat.label}
          </Link>
        ))}
      </div>

      {/* 3. Shelves / Search Results */}
      {items.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-slate-800 rounded-2xl bg-[#0e131d]/30">
          <p className="text-slate-400 text-sm font-medium">No series match this query.</p>
        </div>
      ) : sanitizedSearch || selectedType !== 'all' ? (
        // Grid View when explicitly filtering or searching
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {items.map((item) => {
            const officialSources = (item.official_links as any[]) || [];
            const primarySource = officialSources[0];

            return (
              <div key={item.id} className="flex flex-col group">
                <div className="w-full aspect-[2/3] relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800/80 group-hover:border-indigo-500/50 transition duration-300">
                  <img
                    src={item.cover_url || '/placeholder.png'}
                    alt={item.title_primary}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                  {item.score ? (
                    <span className="absolute top-1 right-1 bg-black/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-bold text-amber-400 flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-400" /> {item.score}
                    </span>
                  ) : null}
                </div>

                <div className="mt-2 space-y-1">
                  <h3 className="font-bold text-[11px] leading-tight line-clamp-2 text-slate-200 group-hover:text-indigo-400 transition">
                    {item.title_primary}
                  </h3>

                  <div className="flex items-center gap-1">
                    {primarySource ? (
                      <a
                        href={`/api/track?mediaId=${encodeURIComponent(item.id)}&target=${encodeURIComponent(primarySource.url)}&step=1`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center text-[9px] py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded font-bold transition flex items-center justify-center gap-0.5"
                      >
                        <span className="truncate">{primarySource.site}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : (
                      <span className="flex-1 text-center text-[9px] py-1 text-slate-600 bg-slate-900 rounded font-medium">
                        Indexed
                      </span>
                    )}

                    <ShareBar title={item.title_primary} slug={item.slug} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // AniList-style horizontal shelves for home
        <div>
          {renderHorizontalShelf('Trending Now', trendingNow)}
          {renderHorizontalShelf('Popular This Season', popularSeason)}
          {renderHorizontalShelf('Trending Manhwa & Webtoons', manhwaShelf, 'manhwa')}
          {renderHorizontalShelf('Trending Anime', animeShelf, 'anime')}
          {renderHorizontalShelf('Popular Manga', mangaShelf, 'manga')}
          {renderHorizontalShelf('Light & Web Novels', novelShelf, 'novel')}
        </div>
      )}
    </div>
  );
}
