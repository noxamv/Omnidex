// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import Spotlight from '../components/Spotlight';
import { Star, Bookmark, Sparkles, TrendingUp, BookOpen } from 'lucide-react';

const MEDIA_TYPES = [
  { label: 'All Catalog', value: 'all' },
  { label: 'Manhwa', value: 'manhwa' },
  { label: 'Manga', value: 'manga' },
  { label: 'Manhua', value: 'manhua' },
  { label: 'Anime', value: 'anime' },
  { label: 'Novels', value: 'novel' },
];

export default function HomePage({
  searchParams,
}: {
  searchParams?: { type?: string; search?: string };
}) {
  const selectedType = (searchParams?.type || 'all').toLowerCase();
  const rawSearch = (searchParams?.search || '').trim();

  const [activeType, setActiveType] = useState(selectedType);
  const [items, setItems] = useState<any[]>([]);
  const [followingItems, setFollowingItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      // 1. Fetch Catalog Items
      let query = supabase
        .from('media_catalog')
        .select('*')
        .order('score', { ascending: false })
        .limit(60);

      if (activeType !== 'all') {
        query = query.eq('media_type', activeType);
      }

      if (rawSearch) {
        query = query.ilike('title_primary', `%${rawSearch}%`);
      }

      const { data } = await query;
      setItems(data || []);

      // 2. Fetch User or Guest Tracked Items
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: trackData } = await supabase
          .from('user_tracker')
          .select('progress, media_catalog(*)')
          .eq('user_id', session.user.id)
          .eq('is_following', true)
          .limit(10);

        if (trackData && trackData.length > 0) {
          setFollowingItems(trackData.map((t: any) => ({
            ...t.media_catalog,
            user_progress: t.progress,
          })));
        }
      } else {
        try {
          const guestLibrary = JSON.parse(localStorage.getItem('omnidex_guest_library') || '[]');
          if (guestLibrary.length > 0) {
            const guestIds = guestLibrary.slice(0, 10).map((g: any) => g.id);
            const { data: guestMedia } = await supabase
              .from('media_catalog')
              .select('*')
              .in('id', guestIds);

            const mapped = (guestMedia || []).map((m: any) => {
              const local = guestLibrary.find((g: any) => g.id === m.id);
              return { ...m, user_progress: local?.progress || 0 };
            });
            setFollowingItems(mapped);
          }
        } catch {}
      }
      setLoading(false);
    }
    loadData();
  }, [activeType, rawSearch]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-20 space-y-8">
      {/* Dynamic Hero Spotlight Banner */}
      <Spotlight items={items.slice(0, 5)} />

      {/* Active Continue Reading Shelf */}
      {followingItems.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-black uppercase tracking-wider text-white">Continue Reading</h2>
            </div>
            <Link href="/library" className="text-xs font-bold text-indigo-400 hover:text-indigo-300">
              View All Shelf →
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {followingItems.map((item) => (
              <Link
                key={item.id}
                href={`/series/${item.id}`}
                className="w-28 sm:w-36 flex-shrink-0 group flex flex-col space-y-1.5"
              >
                <div className="aspect-[2/3] w-full rounded-xl overflow-hidden bg-zinc-900 border border-white/10 group-hover:border-indigo-500/50 transition relative">
                  <img src={item.cover_url || '/placeholder.svg'} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                  <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/85 backdrop-blur-md text-[10px] font-black text-indigo-300">
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

      {/* Category Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {MEDIA_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setActiveType(t.value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition whitespace-nowrap ${
              activeType === t.value
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Primary Discovery Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-black uppercase tracking-wider text-white">Top Rated & Trending</h2>
          </div>
          <span className="text-xs text-zinc-500 font-semibold">{items.length} titles listed</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-2xl bg-zinc-900/40 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/series/${item.id}`}
                className="group flex flex-col space-y-2 focus:outline-none"
              >
                <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/[0.08] group-hover:border-indigo-500/60 shadow-xl group-hover:shadow-indigo-500/10 transition relative">
                  <img
                    src={item.cover_url || '/placeholder.svg'}
                    alt={item.title_primary}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <span className="text-[10px] font-black uppercase text-zinc-300">
                      {item.format || item.media_type}
                    </span>
                  </div>
                  {item.score && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-lg bg-black/75 backdrop-blur-md text-[10px] font-black text-amber-300 border border-white/10 flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-400" /> {item.score}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-bold text-zinc-200 group-hover:text-indigo-400 transition truncate">
                    {item.title_primary}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase font-semibold">
                    <span>{item.media_type}</span>
                    <span>•</span>
                    <span className="truncate">{item.status}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
