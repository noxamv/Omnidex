import Link from 'next/link';
import { supabase } from '../lib/supabase';
import Spotlight from '../components/Spotlight';
import ShareBar from '../components/ShareBar';
import { ExternalLink, Star } from 'lucide-react';

export const revalidate = 1800; // Refreshes every 30 minutes

export default async function HomePage({
  searchParams,
}: {
  searchParams: { type?: string; search?: string };
}) {
  const selectedType = searchParams?.type || 'all';
  const searchQuery = searchParams?.search || '';

  let query = supabase
    .from('media_catalog')
    .select('*')
    .order('score', { ascending: false })
    .limit(48);

  if (selectedType !== 'all') {
    query = query.eq('media_type', selectedType);
  }

  if (searchQuery) {
    query = query.ilike('title_primary', `%${searchQuery}%`);
  }

  const { data: catalog } = await query;
  const spotlightItem = catalog && catalog.length > 0 ? catalog[0] : null;
  const listItems = catalog && catalog.length > 0 ? catalog.slice(1) : [];

  const categories = [
    { label: 'All Catalog', value: 'all' },
    { label: 'Manhwa (Webtoons)', value: 'manhwa' },
    { label: 'Anime', value: 'anime' },
    { label: 'Manga', value: 'manga' },
    { label: 'Light & Web Novels', value: 'novel' },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
      {/* 1. AniList-Style Hero Spotlight (shown when not searching) */}
      {!searchQuery && spotlightItem && (
        <Spotlight item={spotlightItem} />
      )}

      {/* 2. MangaFlow Filter Navigation Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6 gap-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-none py-1">
          {categories.map((cat) => (
            <Link
              key={cat.value}
              href={`/?type=${cat.value}${searchQuery ? `&search=${searchQuery}` : ''}`}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                selectedType === cat.value
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-[#111622] border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              {cat.label}
            </Link>
          ))}
        </div>

        <span className="text-xs text-slate-500 font-medium hidden sm:block whitespace-nowrap">
          {catalog?.length || 0} entries
        </span>
      </div>

      {/* 3. Media Grid */}
      {(!catalog || catalog.length === 0) ? (
        <div className="text-center py-24 border border-dashed border-slate-800 rounded-2xl bg-[#0e131d]/40">
          <p className="text-slate-400 font-medium">No titles indexed matching this filter.</p>
          <p className="text-xs text-slate-600 mt-1">Automatic sync runs every 30 minutes via GitHub Actions.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
          {(searchQuery ? catalog : listItems).map((item) => {
            const officialSources = (item.official_links as any[]) || [];
            const primarySource = officialSources[0];

            return (
              <div
                key={item.id}
                className="group flex flex-col bg-[#0e131d] rounded-xl border border-slate-800/80 overflow-hidden hover:border-indigo-500/50 transition duration-300 shadow-md"
              >
                {/* Poster Artwork */}
                <div className="aspect-[3/4] relative overflow-hidden bg-slate-900">
                  <img
                    src={item.cover_url || '/placeholder.png'}
                    alt={item.title_primary}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                  {item.score && (
                    <span className="absolute top-2 right-2 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[11px] font-bold text-amber-400 flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-amber-400" /> {item.score}
                    </span>
                  )}
                  <span className="absolute bottom-2 left-2 bg-[#07090e]/85 border border-slate-700/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] uppercase font-bold text-indigo-300">
                    {item.media_type}
                  </span>
                </div>

                {/* Card Metadata & Action Buttons */}
                <div className="p-3 flex flex-col flex-1 justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-xs leading-snug line-clamp-2 text-slate-200 group-hover:text-indigo-400 transition">
                      {item.title_primary}
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase font-medium">
                      {item.format || item.status}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/60">
                    {primarySource ? (
                      <a
                        href={`/api/track?mediaId=${item.id}&target=${encodeURIComponent(primarySource.url)}&step=1`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center text-[11px] py-1.5 bg-indigo-600/15 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg font-bold border border-indigo-500/20 hover:border-transparent transition flex items-center justify-center gap-1"
                      >
                        <span>{primarySource.site}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="flex-1 text-center text-[10px] py-1.5 text-slate-600 bg-slate-900 rounded-lg">
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
      )}
    </main>
  );
}
