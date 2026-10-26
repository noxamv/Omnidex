// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import Spotlight from '../components/Spotlight';
import { 
  Star, Bookmark, TrendingUp, Flame, Sparkles, 
  BookOpen, ChevronRight, Share2, Copy, Check
} from 'lucide-react';

const SUB_FILTERS = [
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
  const [trendingFilter, setTrendingFilter] = useState('all');
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const { data } = await supabase
        .from('media_catalog')
        .select('*')
        .order('score', { ascending: false })
        .limit(160);

      const items = data || [];
      setCatalog(items);

      // Fetch user/guest followed titles
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

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.origin);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const trendingFiltered = catalog.filter((item) => 
    trendingFilter === 'all' ? true : item.media_type === trendingFilter
  );

  const manhwaSection = catalog.filter((item) => item.media_type === 'manhwa').slice(0, 15);
  const mangaSection = catalog.filter((item) => item.media_type === 'manga').slice(0, 15);
  const animeSection = catalog.filter((item) => item.media_type === 'anime').slice(0, 15);
  const novelSection = catalog.filter((item) => item.media_type === 'novel').slice(0, 15);

  const spotlightPool = catalog.slice(0, 7);
  const activeSpotlight = spotlightPool[spotlightIndex] || catalog[0] || null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-24 space-y-8">
      {/* 1. Hero Spotlight */}
      {activeSpotlight && (
        <Spotlight
          item={activeSpotlight}
          index={spotlightIndex}
          total={spotlightPool.length}
          onSelectIndex={(idx) => setSpotlightIndex(idx)}
        />
      )}

      {/* 2. MangaFlow Inline Social Share Strip */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-900/60 border border-white/[0.06] backdrop-blur-md">
        <span className="text-xs font-bold text-zinc-400 pl-1">Share Omnidex:</span>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <a
            href="https://twitter.com/intent/tweet?text=Track%20all%20manga,%20manhwa,%20anime%20and%20novels%20legally%20on%20Omnidex!&url=https://omnidex.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-black transition"
            title="Share on X"
          >
            𝕏
          </a>
          <a
            href="https://api.whatsapp.com/send?text=Track%20all%20manga,%20manhwa,%20anime%20and%20novels%20on%20Omnidex:%20https://omnidex.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] flex items-center justify-center text-xs font-bold transition"
            title="Share on WhatsApp"
          >
            WA
          </a>
          <a
            href="https://t.me/share/url?url=https://omnidex.vercel.app&text=Track%20your%20series%20on%20Omnidex"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-xl bg-[#229ED9]/20 hover:bg-[#229ED9]/30 text-[#229ED9] flex items-center justify-center text-xs font-bold transition"
            title="Share on Telegram"
          >
            TG
          </a>
          <a
            href="https://www.reddit.com/submit?url=https://omnidex.vercel.app&title=Omnidex%20Official%20Media%20Tracker"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-xl bg-[#FF4500]/20 hover:bg-[#FF4500]/30 text-[#FF4500] flex items-center justify-center text-xs font-bold transition"
            title="Share on Reddit"
          >
            RD
          </a>
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 flex items-center gap-1.5 transition"
            title="Copy URL"
          >
            {linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{linkCopied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* 3. Continue Reading / Active Tracking Tray */}
      {followingItems.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                Continue Reading
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

      {/* 4. Trending Series Carousel with Sub-bar Filters */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-500" />
            <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
              Trending Releases
            </h2>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            {SUB_FILTERS.map((f) => (
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

      {/* 5. Popular Korean Manhwa Row */}
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

      {/* 6. Popular Japanese Manga Row */}
      {mangaSection.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-400" />
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                Japanese Manga Series (JP)
              </h2>
            </div>
            <Link href="/filter?format=manga" className="text-xs font-bold text-rose-400 hover:text-rose-300">
              See All →
            </Link>
          </div>

          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 scrollbar-none snap-x">
            {mangaSection.map((item) => (
              <Link
                key={item.id}
                href={`/series/${item.id}`}
                className="w-32 sm:w-44 flex-shrink-0 group flex flex-col space-y-2 snap-start"
              >
                <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/[0.08] group-hover:border-rose-500/60 shadow-xl transition relative">
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
                  <h3 className="text-xs font-bold text-zinc-200 group-hover:text-rose-400 transition truncate">
                    {item.title_primary}
                  </h3>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase">{item.status}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 7. Web & Light Novels Row */}
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
