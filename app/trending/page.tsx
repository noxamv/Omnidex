// app/trending/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { Flame, Star, ArrowLeft } from 'lucide-react';

const TABS = [
  { label: 'All', value: 'all' },
  { label: 'Anime', value: 'anime' },
  { label: 'Manga', value: 'manga' },
  { label: 'Manhwa', value: 'manhwa' },
  { label: 'Manhua', value: 'manhua' },
  { label: 'Novels', value: 'novel' },
];

export default function TrendingPage() {
  const [selectedTab, setSelectedTab] = useState('all');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTrending() {
      setLoading(true);
      let query = supabase.from('media_catalog').select('*').limit(60);
      if (selectedTab !== 'all') query = query.eq('media_type', selectedTab);
      query = query.order('score', { ascending: false, nullsFirst: false });

      const { data } = await query;
      setItems((data || []).slice(0, 40));
      setLoading(false);
    }
    loadTrending();
  }, [selectedTab]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-24 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500" /> Trending Series
          </h1>
          <p className="text-xs text-zinc-400">Top 40 high-velocity releases across all mediums</p>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setSelectedTab(t.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedTab === t.value
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 font-black'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-zinc-500 font-bold uppercase">Loading trending titles...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {items.map((item, idx) => (
            <Link key={item.id} href={`/series/${item.id}`} className="group flex flex-col space-y-2">
              <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 group-hover:border-rose-500/60 shadow-xl transition relative">
                <img src={item.cover_url || '/placeholder.svg'} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-black text-white border border-white/10">
                  #{idx + 1}
                </span>
                {item.score && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-black text-amber-300 border border-white/10 flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-amber-400" /> {item.score}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-xs font-bold text-zinc-200 group-hover:text-rose-400 truncate">{item.title_primary}</h3>
                <span className="text-[10px] text-zinc-500 uppercase font-semibold">{item.media_type}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
