// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import Spotlight from '../components/Spotlight';
import { 
  Star, Bookmark, TrendingUp, Flame, Sparkles, 
  BookOpen, ChevronRight, Compass, Clock
} from 'lucide-react';

const SUB_BAR_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Manhwa (KR)', value: 'manhwa' },
  { label: 'Manga (JP)', value: 'manga' },
  { label: 'Manhua (CN)', value: 'manhua' },
  { label: 'Anime', value: 'anime' },
  { label: 'Novels', value: 'novel' },
];

export default function HomePage() {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [followingItems, setFollowingItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [spotlightIndex, setSpotlightIndex] = useState(0);

  // Section-specific sub-filters (MangaFlow design)
  const [trendingFilter, setTrendingFilter] = useState('all');
  const [popularFilter, setPopularFilter] = useState('all');

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      // Fetch top 120 titles from catalog
      const { data } = await supabase
        .from('media_catalog')
        .select('*')
        .order('score', { ascending: false })
        .limit(120);

      const items = data || [];
      setCatalog(items);

      // Fetch User or Guest Tracked Items
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: trackData } = await supabase
          .from('user_tracker')
          .select('progress, status, media_catalog(*)')
          .eq('user_id', session.user.id)
          .eq('is_following', true)
          .limit(12);

        if (trackData && trackData.length > 0) {
          setFollowingItems(trackData.map((t: any) => ({
            ...t.media_catalog,
            user_progress: t.progress,
            user_status: t.status,
          })));
        }
      } else {
        try {
          const guestLibrary = JSON.parse(localStorage.getItem('omnidex_guest_library') || '[]');
          if (guestLibrary.length > 0) {
            const guestIds = guestLibrary.slice(0, 12).map((g: any) => g.id);
            const { data: guestMedia } = await supabase
              .from('media_catalog')
              .select('*')
              .in('id', guestIds);

            const mapped = (guestMedia || []).map((m: any) => {
              const local = guestLibrary.find((g: any) => g.id === m.id);
              return { 
                ...m, 
                user_progress: local?.progress || 0,
                user_status: local?.status || 'reading'
              };
            });
            setFollowingItems(mapped);
          }
        } catch {}
      }
      setLoading(false);
    }
    loadData();
  }, []);

  // Filtered pools for carousels
  const trendingFiltered = catalog.filter((item) => 
    trendingFilter === 'all' ? true : item.media_type === trendingFilter
  );

  const popularFiltered = catalog.filter((item) => 
    popularFilter === 'all' ? true : item.media_type === popularFilter
  );

  const manhwaSection = catalog.filter((item) => item.media_type === 'manhwa').slice(0, 15);
  const animeSection = catalog.filter((item) => item.media_type === 'anime').slice(0, 15);
  const novelSection = catalog.filter((item) => item.media_type === 'novel').slice(0, 15);

  const spotlightPool = catalog.slice(0, 7);
  const activeSpotlight = spotlightPool[spotlightIndex] || catalog[0] || null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-24 space-y-10">
      {/* 1. Dynamic Hero Spotlight */}
      {activeSpotlight && (
        <Spotlight
          item={activeSpotlight}
          index={spotlightIndex}
          total={spotlightPool.length}
          onSelectIndex={(idx) => setSpotlightIndex(idx)}
        />
      )}

      {/* 2. MangaFlow "Continue Tracking / In-Progress" Horizontal Carousel */}
      {followingItems.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                Continue Tracking
              </h2>
            </div>
            <Link href="/library" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              <span>View Library</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-none snap-x">
            {followingItems.map((item) => (
              <Link
                key={item.id}
                href={`/series/${item.id}`}
                className="w-32 sm:w-40 flex-shrink-0 group flex flex-col space-y-1.5 snap-start"
              >
                <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 group-hover:border-indigo-500/60 transition relative shadow-lg">
                  <img
                    src={item.cover_url || '/placeholder.svg'}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-md text-[10px] font-black text-indigo-300 border border-white/10">
                    Ep/Ch {item.user_progress}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-zinc-200 group-hover:text-indigo-400 truncate">
                  {item.title_primary}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 3. MangaFlow Section: Trending Series with Dynamic Sub-Bar Filter */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-500" />
            <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
              Trending Releases
            </h2>
          </div>

          {/* Sub-bar Filter (All, Anime, Manga, Manhwa, Manhua, Novel) */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            {SUB_BAR_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setTrendingFilter(f.value)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  trendingFilter === f.value
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Horizontal Swiper */}
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 scrollbar-none snap-x">
          {trendingFiltered.slice(0, 18).map((item, idx) => (
            <Link
              key={item.id}
              href={`/series/${item.id}`}
              className="w-32 sm:w-44 flex-shrink-0 group flex flex-col space-y-2 snap-start"
            >
              <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/[0.08] group-hover:border-indigo-500/60 shadow-xl transition relative">
                <img
                  src={item.cover_url || '/placeholder.svg'}
                  alt={item.title_primary}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  loading="lazy"
                />
                <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-black text-white border border-white/10">
                  #{idx + 1}
                </span>
                {item.score && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-black text-amber-300 border border-white/10 flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-amber-400" /> {item.score}
                  </span>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <span className="text-[10px] font-black uppercase text-zinc-300">
                    {item.format || item.media_type}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-zinc-200 group-hover:text-indigo-400 transition truncate">
                  {item.title_primary}
                </h3>
                <div className="flex items-center gap-1 text-[10px] text-zinc-500 uppercase font-semibold">
                  <span>{item.media_type}</span>
                  <span>•</span>
                  <span>{item.status}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. MangaFlow Section: Top Rated Manhwa & Webtoons */}
      {manhwaSection.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                Popular Manhwa & Webtoons (KR)
              </h2>
            </div>
            <Link href="/filter?format=manhwa" className="text-xs font-bold text-indigo-400 hover:text-indigo-300">
              See All →
            </Link>
          </div>

          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 scrollbar-none snap-x">
            {manhwaSection.map((item) => (
              <Link
                key={item.id}
                href={`/series/${item.id}`}
                className="w-32 sm:w-44 flex-shrink-0 group flex flex-col space-y-2 snap-start"
              >
                <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/[0.08] group-hover:border-indigo-500/60 shadow-xl transition relative">
                  <img
                    src={item.cover_url || '/placeholder.svg'}
                    alt={item.title_primary}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                  {item.score && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-black text-amber-300 border border-white/10 flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-400" /> {item.score}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-200 group-hover:text-indigo-400 transition truncate">
                    {item.title_primary}
                  </h3>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase">{item.status}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 5. MangaFlow Section: Web Novels & Light Novels */}
      {novelSection.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                Web Novels & Light Novels
              </h2>
            </div>
            <Link href="/filter?format=novel" className="text-xs font-bold text-cyan-400 hover:text-cyan-300">
              See All →
            </Link>
          </div>

          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 scrollbar-none snap-x">
            {novelSection.map((item) => (
              <Link
                key={item.id}
                href={`/series/${item.id}`}
                className="w-32 sm:w-44 flex-shrink-0 group flex flex-col space-y-2 snap-start"
              >
                <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/[0.08] group-hover:border-cyan-500/60 shadow-xl transition relative">
                  <img
                    src={item.cover_url || '/placeholder.svg'}
                    alt={item.title_primary}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                  {item.score && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-black text-amber-300 border border-white/10 flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-400" /> {item.score}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-200 group-hover:text-cyan-400 transition truncate">
                    {item.title_primary}
                  </h3>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase">{item.status}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
