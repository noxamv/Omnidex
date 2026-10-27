// app/library/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { 
  ArrowLeft, Bookmark, Plus, Minus, BookOpen, 
  Search, Flame, CheckCircle2, Clock
} from 'lucide-react';

const SHELVES = [
  { label: 'All', value: 'all' },
  { label: 'Reading / Watching', value: 'reading' },
  { label: 'Plan to Read', value: 'plan_to_read' },
  { label: 'On Hold', value: 'on_hold' },
  { label: 'Completed', value: 'completed' },
];

export default function UserLibraryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);
  const [totalDatabaseCount, setTotalDatabaseCount] = useState<number | null>(null);

  useEffect(() => {
    async function fetchUserLibrary() {
      setLoading(true);

      supabase
        .from('media_catalog')
        .select('*', { count: 'exact', head: true })
        .then(({ count }) => {
          if (count) setTotalDatabaseCount(count);
        });

      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const { data } = await supabase
          .from('user_tracker')
          .select('progress, status, rating, media_catalog(*)')
          .eq('user_id', currentUser.id)
          .eq('is_following', true);

        const mapped = (data || []).map((row: any) => ({
          ...row.media_catalog,
          user_progress: row.progress || 0,
          user_status: row.status || 'reading',
          user_rating: row.rating || 0,
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
                user_status: local?.status || 'reading',
                user_rating: local?.rating || 0,
              };
            });
            setItems(mapped);
          }
        } catch {}
      }
      setLoading(false);
    }
    fetchUserLibrary();
  }, []);

  const handleQuickStep = async (item: any, delta: number) => {
    const nextProg = Math.max(0, item.user_progress + delta);
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, user_progress: nextProg } : i))
    );

    if (user) {
      await supabase.from('user_tracker').upsert({
        user_id: user.id,
        media_id: item.id,
        progress: nextProg,
        status: item.user_status,
        is_following: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,media_id' });
    } else {
      let guest = JSON.parse(localStorage.getItem('omnidex_guest_library') || '[]');
      const idx = guest.findIndex((g: any) => g.id === item.id);
      if (idx >= 0) guest[idx].progress = nextProg;
      localStorage.setItem('omnidex_guest_library', JSON.stringify(guest));
    }
  };

  const filteredItems = items
    .filter((i) => activeFilter === 'all' || i.user_status === activeFilter)
    .filter((i) => !searchQuery.trim() || i.title_primary.toLowerCase().includes(searchQuery.toLowerCase().trim()));

  const totalChapters = items.reduce((acc, cur) => acc + (cur.user_progress || 0), 0);
  const activeReading = items.filter((i) => i.user_status === 'reading').length;
  const completedCount = items.filter((i) => i.user_status === 'completed' || i.user_status === 'finished').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-20 space-y-5">
      {/* Streamlined Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-white">Library</h1>
            <p className="text-xs text-zinc-400">Tracking {items.length} series across your shelves</p>
          </div>
        </div>
      </div>

      {/* Sleek, 1-Line Compact Statistics Pill Bar */}
      <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-zinc-900/70 border border-white/10 text-xs text-zinc-400 overflow-x-auto scrollbar-none">
        <span className="flex items-center gap-1.5 font-bold text-zinc-300 whitespace-nowrap">
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Units Consumed: <strong className="text-white">{totalChapters}</strong>
        </span>
        <span>•</span>
        <span className="flex items-center gap-1.5 font-bold text-zinc-300 whitespace-nowrap">
          <Flame className="w-3.5 h-3.5 text-amber-400" /> Reading: <strong className="text-white">{activeReading}</strong>
        </span>
        <span>•</span>
        <span className="flex items-center gap-1.5 font-bold text-zinc-300 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Completed: <strong className="text-white">{completedCount}</strong>
        </span>
      </div>

      {/* Filter Tabs & In-Shelf Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
          {SHELVES.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeFilter === tab.value
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search within your library..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-900/90 border border-white/10 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Series Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-zinc-500 font-bold uppercase tracking-wider">
          Loading library shelves...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl p-8 space-y-3">
          <Bookmark className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="text-zinc-400 text-sm font-semibold">No series on this shelf.</p>
          <Link href="/" className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition">
            Explore {totalDatabaseCount ? `${totalDatabaseCount.toLocaleString()} Series` : 'Catalog'}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="group flex flex-col space-y-2">
              <Link href={`/series/${item.id}`} className="aspect-[2/3] w-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 group-hover:border-indigo-500/60 transition relative shadow-lg">
                <img src={item.cover_url || '/placeholder.svg'} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                <span className="absolute bottom-2 right-2 bg-black/85 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] font-black text-indigo-300 border border-white/10">
                  Ch/Ep {item.user_progress}
                </span>
              </Link>

              <div className="space-y-1.5">
                <Link href={`/series/${item.id}`} className="text-xs font-bold text-zinc-200 group-hover:text-indigo-400 truncate block">
                  {item.title_primary}
                </Link>

                <div className="flex items-center justify-between bg-zinc-900/80 px-2 py-1 rounded-xl border border-white/5">
                  <span className="text-[10px] text-zinc-400 font-bold">Quick Step:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleQuickStep(item, -1)}
                      className="p-1 rounded hover:bg-zinc-800 text-zinc-300 transition"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleQuickStep(item, 1)}
                      className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white transition"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
