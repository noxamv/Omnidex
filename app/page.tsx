'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import Spotlight from '../components/Spotlight';
import { Star, Check, Link2, Bookmark } from 'lucide-react';

export default function HomePage({
  searchParams,
}: {
  searchParams?: { type?: string; search?: string };
}) {
  const selectedType = (searchParams?.type || 'all').toLowerCase();
  const rawSearch = (searchParams?.search || '').trim();

  const [items, setItems] = useState<any[]>([]);
  const [followingItems, setFollowingItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      // 1. Fetch Catalog
      let query = supabase
        .from('media_catalog')
        .select('*')
        .order('score', { ascending: false })
        .limit(100);

      if (selectedType !== 'all') {
        query = query.eq('media_type', selectedType);
      }

      if (rawSearch) {
        query = query.ilike('title_primary', `%${rawSearch}%`);
      }

      const { data } = await query;
      const catalog = data || [];
      setItems(catalog);

      // 2. Fetch User or Guest Followed Series
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: trackData } = await supabase
          .from('user_tracker')
          .select('progress, media_catalog(*)')
          .eq('user_id', session.user.id)
          .eq('is_following', true);

        if (trackData && trackData.length > 0) {
          setFollowingItems(trackData.map((t: any) => ({
            ...t.media_catalog,
            user_progress: t.progress
          })));
        } else {
          setFollowingItems([]);
        }
      } else {
        // Fallback for Guest LocalStorage
        try {
          const guestLibrary = JSON.parse(localStorage.getItem('omnidex_guest_library') || '[]');
          if (guestLibrary.length > 0) {
            const guestIds = guestLibrary.map((g: any) => g.id);
            const matched = catalog.filter(c => guestIds.includes(c.id)).map(c => {
              const local = guestLibrary.find((g: any) => g.id === c.id);
              return { ...c, user_progress: local?.progress || 0 };
            });
            setFollowingItems(matched);
          }
        } catch (e) {}
      }

      setLoading(false);
    }
    loadData();
  }, [selectedType, rawSearch]);

  // Spotlight 7-Series 3-Second Auto-Rotation
  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setSpotlightIndex((prev) => (prev + 1) % Math.min(7, items.length));
    }, 3000);
    return () => clearInterval(interval);
  }, [items]);

  const spotlightList = items.slice(0, 7);
  const currentSpotlight = spotlightList[spotlightIndex] || items[0];

  // Discovery Shelves
  const trendingSeries = items.slice(0, 15);
  const popularSeries = [...items].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 15);
  const latestReleases = [...items].reverse().slice(0, 15);
  const randomSeries = [...items].sort(() => 0.5 - Math.random()).slice(0, 15);

  // Exact Requested Category Order
  const categories = [
    { label: 'All Media', value: 'all' },
    { label: 'Anime', value: 'anime' },
    { label: 'Manga', value: 'manga' },
    { label: 'Manhwa', value: 'manhwa' },
    { label: 'Manhua', value: 'manhua' },
    { label: 'Novel', value: 'novel' },
  ];

  const handleShare = (platform: string) => {
    if (typeof window === 'undefined') return;
    const url = encodeURIComponent(window.location.origin);
    const text = encodeURIComponent('Omnidex — Official Media Tracker for Anime, Manga, Manhwa & Novels');

    let target = '';
    if (platform === 'twitter') target = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
    if (platform === 'facebook') target = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    if (platform === 'whatsapp') target = `https://api.whatsapp.com/send?text=${text}%20${url}`;
    if (platform === 'telegram') target = `https://t.me/share/url?url=${url}&text=${text}`;
    if (platform === 'reddit') target = `https://www.reddit.com/submit?url=${url}&title=${text}`;

    if (platform === 'copy') {
      navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }

    if (target) window.open(target, '_blank', 'noopener,noreferrer');
  };

  const renderHorizontalShelf = (title: string, list: any[], isFollowingShelf = false) => {
    if (list.length === 0) return null;

    return (
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-white flex items-center gap-1.5">
            <span className={`w-1.5 h-3.5 rounded-full ${isFollowingShelf ? 'bg-emerald-400' : 'bg-indigo-500'}`} />
            <span>{title}</span>
            {isFollowingShelf && (
              <span className="text-[10px] text-slate-500 font-semibold normal-case">({list.length})</span>
            )}
          </h2>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
          {list.map((item) => (
            <Link
              key={item.id}
              href={`/series/${item.id}`}
              className="w-28 sm:w-36 flex-shrink-0 snap-start flex flex-col group cursor-pointer"
            >
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

                {isFollowingShelf && item.user_progress !== undefined ? (
                  <span className="absolute bottom-1.5 right-1.5 bg-indigo-600/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-black text-white">
                    Ch/Ep {item.user_progress}
                  </span>
                ) : (
                  <span className="absolute bottom-1.5 left-1.5 bg-[#0a0d14]/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-indigo-300">
                    {item.media_type}
                  </span>
                )}
              </div>

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
      {currentSpotlight && (
        <Spotlight
          item={currentSpotlight}
          index={spotlightIndex}
          total={Math.min(7, items.length)}
          onSelectIndex={(idx) => setSpotlightIndex(idx)}
        />
      )}

      {/* 2. Blended Dark Share Bar */}
      <div className="flex items-center justify-between bg-[#0e121b] border border-slate-800/80 rounded-2xl px-3.5 py-2 mb-4 shadow-sm">
        <span className="text-[11px] font-bold text-slate-400">Share Omnidex:</span>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Facebook */}
          <button
            onClick={() => handleShare('facebook')}
            aria-label="Share on Facebook"
            className="w-7 h-7 rounded-full bg-[#111622] hover:bg-[#1877f2]/20 border border-slate-800 hover:border-[#1877f2]/50 flex items-center justify-center text-slate-400 hover:text-[#1877f2] transition active:scale-90"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </button>

          {/* X (Twitter) */}
          <button
            onClick={() => handleShare('twitter')}
            aria-label="Share on X"
            className="w-7 h-7 rounded-full bg-[#111622] hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition active:scale-90"
          >
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 24.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </button>

          {/* WhatsApp */}
          <button
            onClick={() => handleShare('whatsapp')}
            aria-label="Share on WhatsApp"
            className="w-7 h-7 rounded-full bg-[#111622] hover:bg-[#25d366]/20 border border-slate-800 hover:border-[#25d366]/50 flex items-center justify-center text-slate-400 hover:text-[#25d366] transition active:scale-90"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
            </svg>
          </button>

          {/* Telegram */}
          <button
            onClick={() => handleShare('telegram')}
            aria-label="Share on Telegram"
            className="w-7 h-7 rounded-full bg-[#111622] hover:bg-[#229ed9]/20 border border-slate-800 hover:border-[#229ed9]/50 flex items-center justify-center text-slate-400 hover:text-[#229ed9] transition active:scale-90"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.832.942z" />
            </svg>
          </button>

          {/* Reddit */}
          <button
            onClick={() => handleShare('reddit')}
            aria-label="Share on Reddit"
            className="w-7 h-7 rounded-full bg-[#111622] hover:bg-[#ff4500]/20 border border-slate-800 hover:border-[#ff4500]/50 flex items-center justify-center text-slate-400 hover:text-[#ff4500] transition active:scale-90"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701z" />
            </svg>
          </button>

          {/* Copy Link */}
          <button
            onClick={() => handleShare('copy')}
            aria-label="Copy link"
            className="w-7 h-7 rounded-full bg-[#111622] hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-300 transition active:scale-90"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 3. Followed Series Shelf (Below Share Bar, Above Trending) */}
      {followingItems.length > 0 && renderHorizontalShelf('Following Series', followingItems, true)}

      {/* 4. Strict Order Category Filter Bar */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-2 mb-4 justify-between sm:justify-start">
        {categories.map((cat) => (
          <Link
            key={cat.value}
            href={`/?type=${cat.value}`}
            prefetch={false}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition whitespace-nowrap ${
              selectedType === cat.value
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800'
            }`}
          >
            {cat.label}
          </Link>
        ))}
      </div>

      {/* 5. Trending and Discovery Shelves */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs">Loading titles...</div>
      ) : (
        <div>
          {renderHorizontalShelf(selectedType === 'all' ? 'Trending Series' : `Trending ${selectedType}`, trendingSeries)}
          {renderHorizontalShelf(selectedType === 'all' ? 'Popular Series' : `Popular ${selectedType}`, popularSeries)}
          {renderHorizontalShelf(selectedType === 'all' ? 'Latest Releases' : `Latest ${selectedType}`, latestReleases)}
          {renderHorizontalShelf(selectedType === 'all' ? 'Random Discoveries' : `Random ${selectedType}`, randomSeries)}
        </div>
      )}
    </div>
  );
}
