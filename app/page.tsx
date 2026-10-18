'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { 
  Star, ChevronRight, ArrowRight, Share2, 
  Check, MessageCircle 
} from 'lucide-react';

export default function HomePage({
  searchParams,
}: {
  searchParams?: { type?: string };
}) {
  const selectedType = (searchParams?.type || 'all').toLowerCase();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadCatalog() {
      setLoading(true);
      let query = supabase
        .from('media_catalog')
        .select('*')
        .order('score', { ascending: false })
        .limit(100);

      if (selectedType !== 'all') {
        query = query.eq('media_type', selectedType);
      }

      const { data } = await query;
      setItems(data || []);
      setLoading(false);
    }
    loadCatalog();
  }, [selectedType]);

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

  // Shelves definition
  const trendingSeries = items.slice(0, 15);
  const popularSeries = [...items].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 15);
  const latestReleases = [...items].reverse().slice(0, 15);
  const randomSeries = [...items].sort(() => 0.5 - Math.random()).slice(0, 15);

  const categories = [
    { label: 'All Media', value: 'all' },
    { label: 'Novels', value: 'novel' },
    { label: 'Manhwa', value: 'manhwa' },
    { label: 'Anime', value: 'anime' },
    { label: 'Manga', value: 'manga' },
  ];

  const handleShare = (platform: string) => {
    if (typeof window === 'undefined') return;
    const url = encodeURIComponent(window.location.origin);
    const text = encodeURIComponent('Track Asian pop culture legally on Omnidex');

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

  const renderHorizontalShelf = (title: string, list: any[]) => {
    if (list.length === 0) return null;

    return (
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-white flex items-center gap-1.5">
            <span className="w-1.5 h-3.5 bg-indigo-500 rounded-full" />
            <span>{title}</span>
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

                <span className="absolute bottom-1.5 left-1.5 bg-[#0a0d14]/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-indigo-300">
                  {item.media_type}
                </span>
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
      
      {/* 1. MangaFlow Compact 7-Series Rotating Spotlight */}
      {currentSpotlight && (
        <div className="relative w-full rounded-2xl overflow-hidden bg-[#0e121b] border border-slate-800/80 p-4 sm:p-5 mb-3 shadow-xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  SPOTLIGHT #{spotlightIndex + 1}
                </span>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {currentSpotlight.media_type}
                </span>
              </div>

              <Link href={`/series/${currentSpotlight.id}`} className="block">
                <h1 className="text-base sm:text-xl font-black text-white hover:text-indigo-400 transition truncate leading-snug">
                  {currentSpotlight.title_primary}
                </h1>
              </Link>

              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed max-w-lg">
                {currentSpotlight.synopsis}
              </p>

              <div className="pt-1 flex items-center gap-3">
                <Link
                  href={`/series/${currentSpotlight.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition active:scale-95"
                >
                  <span>Track Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                {/* 7 Switcher Dots */}
                <div className="flex items-center gap-1.5">
                  {spotlightList.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSpotlightIndex(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        spotlightIndex === idx ? 'w-5 bg-indigo-500' : 'w-1.5 bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <Link
              href={`/series/${currentSpotlight.id}`}
              className="w-20 sm:w-28 aspect-[2/3] flex-shrink-0 rounded-xl overflow-hidden shadow-xl border border-slate-700/60 bg-slate-900 group"
            >
              <img
                src={currentSpotlight.cover_url}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
            </Link>
          </div>
        </div>
      )}

      {/* 2. MangaFire / MangaFlow Social Share Bar */}
      <div className="flex items-center justify-between bg-[#0e121b] border border-slate-800/80 rounded-xl px-3 py-2 mb-4">
        <span className="text-[11px] font-bold text-slate-400">Share Omnidex:</span>
        <div className="flex items-center gap-2">
          {['twitter', 'facebook', 'whatsapp', 'telegram', 'reddit'].map((p) => (
            <button
              key={p}
              onClick={() => handleShare(p)}
              className="p-1 rounded-lg bg-[#111622] hover:bg-indigo-600/30 text-slate-400 hover:text-white transition capitalize text-[10px] font-bold px-2 py-0.5"
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => handleShare('copy')}
            className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition"
          >
            {copied ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* 3. Blended Category Navigation Strip */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2 mb-5">
        {categories.map((cat) => (
          <Link
            key={cat.value}
            href={`/?type=${cat.value}`}
            prefetch={false}
            className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap ${
              selectedType === cat.value
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800'
            }`}
          >
            {cat.label}
          </Link>
        ))}
      </div>

      {/* 4. Categorized Shelves */}
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
