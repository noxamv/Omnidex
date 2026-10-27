// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import Spotlight from '../components/Spotlight';
import { 
  Star, Bookmark, Flame, Sparkles, 
  ChevronRight, Check, Link2, Shuffle, Clock
} from 'lucide-react';

const CATEGORY_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Anime', value: 'anime' },
  { label: 'Manga', value: 'manga' },
  { label: 'Manhwa', value: 'manhwa' },
  { label: 'Manhua', value: 'manhua' },
  { label: 'Novels', value: 'novel' },
];

export default function HomePage() {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [followingItems, setFollowingItems] = useState<any[]>([]);
  const [spotlightIndex, setSpotlightIndex] = useState(0);

  const [trendingTab, setTrendingTab] = useState('all');
  const [popularTab, setPopularTab] = useState('all');
  const [latestTab, setLatestTab] = useState('all');

  const [randomList, setRandomList] = useState<any[]>([]);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase
        .from('media_catalog')
        .select('*')
        .order('score', { ascending: false, nullsFirst: false })
        .limit(300);

      const items = data || [];
      setCatalog(items);

      // Stable Random Picks: Cached in sessionStorage so it doesn't shuffle on every scroll/rerender
      const cachedRandom = sessionStorage.getItem('omnidex_random_pool');
      if (cachedRandom) {
        setRandomList(JSON.parse(cachedRandom));
      } else if (items.length > 0) {
        const shuffled = [...items].sort(() => 0.5 - Math.random()).slice(0, 15);
        setRandomList(shuffled);
        sessionStorage.setItem('omnidex_random_pool', JSON.stringify(shuffled));
      }

      // Check for user/guest followed titles
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

  const filterList = (list: any[], tab: string) => {
    if (tab === 'all') return list.slice(0, 20);
    return list.filter((item) => item.media_type === tab).slice(0, 20);
  };

  const trendingList = filterList(catalog, trendingTab);
  const popularList = filterList([...catalog].sort((a, b) => (b.score || 0) - (a.score || 0)), popularTab);
  const latestList = filterList([...catalog].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()), latestTab);

  // Filter out titles with broken or gradient stock covers from the Spotlight
  const spotlightPool = catalog
    .filter((i) => i.cover_url && !i.cover_url.includes('placeholder') && !i.cover_url.includes('unsplash'))
    .slice(0, 7);
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

      {/* 2. Vector SVG Social Share Bar */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-900/60 border border-white/[0.06] backdrop-blur-md">
        <span className="text-xs font-bold text-zinc-400 pl-1 whitespace-nowrap">Share Omnidex:</span>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <a
            href="https://twitter.com/intent/tweet?text=Track%20all%20manga,%20manhwa,%20anime%20and%20novels%20legally%20on%20Omnidex!&url=https://omnidex.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition p-2"
            title="Share on X"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>

          <a
            href="https://www.facebook.com/sharer/sharer.php?u=https://omnidex.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-xl bg-[#1877F2]/20 hover:bg-[#1877F2]/30 text-[#1877F2] flex items-center justify-center transition p-2"
            title="Share on Facebook"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>

          <a
            href="https://api.whatsapp.com/send?text=Track%20all%20manga,%20manhwa,%20anime%20and%20novels%20on%20Omnidex:%20https://omnidex.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] flex items-center justify-center transition p-2"
            title="Share on WhatsApp"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.693.078-2.227-.557-1.809-.748-2.952-2.586-3.04-2.705-.088-.117-.732-.976-.732-1.862 0-.886.462-1.32.628-1.496.165-.177.362-.221.483-.221.121 0 .241.002.348.006.113.004.264-.043.414.316.155.37.53 1.293.577 1.388.046.095.077.206.014.33-.063.125-.094.204-.187.313-.094.11-.198.245-.283.33-.095.094-.194.197-.084.385.11.189.489.807 1.05 1.306.722.643 1.33.842 1.519.936.19.094.301.079.412-.047.11-.127.476-.554.603-.744.127-.19.254-.158.428-.094.174.063 1.107.522 1.298.617.19.095.317.142.364.221.047.079.047.458-.097.863z"/>
            </svg>
          </a>

          <a
            href="https://www.reddit.com/submit?url=https://omnidex.vercel.app&title=Omnidex%20Official%20Media%20Tracker"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-xl bg-[#FF4500]/20 hover:bg-[#FF4500]/30 text-[#FF4500] flex items-center justify-center transition p-2"
            title="Share on Reddit"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701z"/>
            </svg>
          </a>

          <a
            href="https://t.me/share/url?url=https://omnidex.vercel.app&text=Track%20your%20series%20on%20Omnidex"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-xl bg-[#229ED9]/20 hover:bg-[#229ED9]/30 text-[#229ED9] flex items-center justify-center transition p-2"
            title="Share on Telegram"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
          </a>

          <button
            onClick={handleCopyLink}
            className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition p-2"
            title="Copy URL"
          >
            {linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 3. Continue Reading / Active Shelf */}
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
              <span>View All</span>
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

      {/* 4. Trending Series (Standardized Sub-Tabs) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-500" />
            <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
              Trending Series
            </h2>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            {CATEGORY_TABS.map((f) => (
              <button
                key={f.value}
                onClick={() => setTrendingTab(f.value)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  trendingTab === f.value
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
          {trendingList.map((item, idx) => (
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

      {/* 5. Popular Series */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
              Popular Series
            </h2>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            {CATEGORY_TABS.map((f) => (
              <button
                key={f.value}
                onClick={() => setPopularTab(f.value)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  popularTab === f.value
                    ? 'bg-amber-500 text-black font-black shadow-md shadow-amber-500/20'
                    : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 scrollbar-none snap-x">
          {popularList.map((item) => (
            <Link
              key={item.id}
              href={`/series/${item.id}`}
              className="w-32 sm:w-44 flex-shrink-0 group flex flex-col space-y-2 snap-start"
            >
              <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/[0.08] group-hover:border-amber-500/60 shadow-xl transition relative">
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
                <h3 className="text-xs font-bold text-zinc-200 group-hover:text-amber-400 transition truncate">
                  {item.title_primary}
                </h3>
                <span className="text-[10px] text-zinc-500 font-semibold uppercase">{item.media_type}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 6. Latest Releases Shelf */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
              Latest Releases & Updates
            </h2>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            {CATEGORY_TABS.map((f) => (
              <button
                key={f.value}
                onClick={() => setLatestTab(f.value)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  latestTab === f.value
                    ? 'bg-cyan-500 text-black font-black shadow-md shadow-cyan-500/20'
                    : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 scrollbar-none snap-x">
          {latestList.map((item) => (
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
                <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md bg-black/85 backdrop-blur-md text-[9px] font-black text-cyan-300 border border-white/10 uppercase">
                  {item.status}
                </span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-zinc-200 group-hover:text-cyan-400 transition truncate">
                  {item.title_primary}
                </h3>
                <span className="text-[10px] text-zinc-500 font-semibold uppercase">{item.media_type}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 7. Frozen Random Picks (Does not shift rapidly on scroll) */}
      {randomList.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shuffle className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                Random Recommendations
              </h2>
            </div>
          </div>

          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 scrollbar-none snap-x">
            {randomList.map((item) => (
              <Link
                key={item.id}
                href={`/series/${item.id}`}
                className="w-32 sm:w-44 flex-shrink-0 group flex flex-col space-y-2 snap-start"
              >
                <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/[0.08] group-hover:border-purple-500/60 shadow-xl transition relative">
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
                  <h3 className="text-xs font-bold text-zinc-200 group-hover:text-purple-400 transition truncate">
                    {item.title_primary}
                  </h3>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase">{item.media_type}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
