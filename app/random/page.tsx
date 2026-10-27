// app/random/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { Shuffle, Star, ArrowLeft, RefreshCw } from 'lucide-react';

export default function RandomPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRandom = async () => {
    setLoading(true);
    const { data } = await supabase.from('media_catalog').select('*').limit(200);
    const shuffled = [...(data || [])].sort(() => 0.5 - Math.random()).slice(0, 30);
    setItems(shuffled);
    setLoading(false);
  };

  useEffect(() => {
    fetchRandom();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Shuffle className="w-5 h-5 text-purple-400" /> Random Explorer
            </h1>
            <p className="text-xs text-zinc-400">Discover hidden gems across all formats</p>
          </div>
        </div>

        <button
          onClick={fetchRandom}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md shadow-purple-600/20"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Shuffle Picks</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-zinc-500 font-bold uppercase">Shuffling recommendations...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {items.map((item) => (
            <Link key={item.id} href={`/series/${item.id}`} className="group flex flex-col space-y-2">
              <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 group-hover:border-purple-500/60 shadow-xl transition relative">
                <img src={item.cover_url || '/placeholder.svg'} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                {item.score && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-black text-amber-300 border border-white/10 flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-amber-400" /> {item.score}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-xs font-bold text-zinc-200 group-hover:text-purple-400 truncate">{item.title_primary}</h3>
                <span className="text-[10px] text-zinc-500 uppercase font-semibold">{item.media_type}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
