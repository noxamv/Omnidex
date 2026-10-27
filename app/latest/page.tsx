// app/latest/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { Clock, ArrowLeft } from 'lucide-react';

const TABS = [
  { label: 'All', value: 'all' },
  { label: 'Anime', value: 'anime' },
  { label: 'Manga', value: 'manga' },
  { label: 'Manhwa', value: 'manhwa' },
  { label: 'Manhua', value: 'manhua' },
  { label: 'Novels', value: 'novel' },
];

export default function LatestPage() {
  const [selectedTab, setSelectedTab] = useState('all');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLatest() {
      setLoading(true);
      let query = supabase.from('media_catalog').select('*').limit(60);
      if (selectedTab !== 'all') query = query.eq('media_type', selectedTab);
      query = query.order('updated_at', { ascending: false });

      const { data } = await query;
      setItems((data || []).slice(0, 40));
      setLoading(false);
    }
    loadLatest();
  }, [selectedTab]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-24 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" /> Latest Releases
          </h1>
          <p className="text-xs text-zinc-400">Recently dropped chapters and fresh episode simulcasts</p>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setSelectedTab(t.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedTab === t.value
                ? 'bg-cyan-500 text-black font-black shadow-md shadow-cyan-500/20'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-zinc-500 font-bold uppercase">Loading latest updates...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {items.map((item) => (
            <Link key={item.id} href={`/series/${item.id}`} className="group flex flex-col space-y-2">
              <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 group-hover:border-cyan-500/60 shadow-xl transition relative">
                <img src={item.cover_url || '/placeholder.svg'} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[9px] font-black text-cyan-300 border border-white/10 uppercase">
                  {item.status}
                </span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-zinc-200 group-hover:text-cyan-400 truncate">{item.title_primary}</h3>
                <span className="text-[10px] text-zinc-500 uppercase font-semibold">{item.media_type}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
