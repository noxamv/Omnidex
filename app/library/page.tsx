'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { ArrowLeft } from 'lucide-react';

export default function UserLibraryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    async function fetchUserLibrary() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data } = await supabase
          .from('user_tracker')
          .select('progress, status, media_catalog(*)')
          .eq('user_id', session.user.id)
          .eq('is_following', true);

        const mapped = (data || []).map((row: any) => ({
          ...row.media_catalog,
          user_progress: row.progress,
          user_status: row.status,
        }));
        setItems(mapped);
      } else {
        try {
          const guestLibrary = JSON.parse(localStorage.getItem('omnidex_guest_library') || '[]');
          if (guestLibrary.length > 0) {
            const guestIds = guestLibrary.map((g: any) => g.id);
            const { data } = await supabase
              .from('media_catalog')
              .select('*')
              .in('id', guestIds);

            const mapped = (data || []).map((row: any) => {
              const local = guestLibrary.find((g: any) => g.id === row.id);
              return {
                ...row,
                user_progress: local?.progress || 0,
                user_status: local?.status || 'plan_to_read',
              };
            });
            setItems(mapped);
          }
        } catch (e) {}
      }
      setLoading(false);
    }
    fetchUserLibrary();
  }, []);

  const filterTabs = [
    { label: 'All', value: 'all' },
    { label: 'Reading / Watching', value: 'reading' },
    { label: 'Plan to Read', value: 'plan_to_read' },
    { label: 'Completed', value: 'completed' },
  ];

  const filteredItems = activeFilter === 'all' 
    ? items 
    : items.filter(i => i.user_status === activeFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-20">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/" className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-lg font-black text-white">My Library Tracker</h1>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2 mb-5">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveFilter(tab.value)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap ${
              activeFilter === tab.value
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 text-xs">Loading library...</div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl">
          <p className="text-slate-400 text-sm">No series in this tracking shelf.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {filteredItems.map((item) => (
            <Link key={item.id} href={`/series/${item.id}`} className="flex flex-col group">
              <div className="w-full aspect-[2/3] relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 group-hover:border-indigo-500/60 transition">
                <img src={item.cover_url || '/placeholder.svg'} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                <span className="absolute bottom-1 right-1 bg-black/85 px-1.5 py-0.5 rounded text-[10px] font-bold text-indigo-400">
                  Ep/Ch {item.user_progress}
                </span>
              </div>
              <h3 className="mt-1.5 font-bold text-xs text-slate-200 truncate">{item.title_primary}</h3>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
