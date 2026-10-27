// app/notifications/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Bell, Check } from 'lucide-react';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function loadNotifications() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      let followedMediaIds: string[] = [];

      if (currentUser) {
        const { data: followed } = await supabase
          .from('user_tracker')
          .select('media_id')
          .eq('user_id', currentUser.id)
          .eq('is_following', true);

        followedMediaIds = (followed || []).map((f: any) => f.media_id);
      } else {
        try {
          const guest = JSON.parse(localStorage.getItem('omnidex_guest_library') || '[]');
          followedMediaIds = guest.map((g: any) => g.id);
        } catch {}
      }

      // If user has no followed items, grab top 8 latest updates as preview
      const query = supabase
        .from('media_catalog')
        .select('id, title_primary, cover_url, total_units, media_type, updated_at')
        .order('updated_at', { ascending: false })
        .limit(10);

      if (followedMediaIds.length > 0) {
        query.in('id', followedMediaIds);
      }

      const { data: results } = await query;

      const caughtUp = localStorage.getItem('omnidex_notifs_caught_up') === 'true';

      const mapped = (results || []).map((series: any) => ({
        id: `notif-${series.id}`,
        mediaId: series.id,
        title: series.title_primary,
        cover_url: series.cover_url,
        media_type: series.media_type,
        unitLabel: series.media_type === 'anime' ? `Episode ${series.total_units || 'Simulcast'}` : `Chapter ${series.total_units || 'New'}`,
        timestamp: new Date(series.updated_at).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric'
        }),
        read: caughtUp,
      }));

      setNotifications(mapped);
      setLoading(false);
    }

    loadNotifications();
  }, []);

  const markAllRead = async () => {
    localStorage.setItem('omnidex_notifs_caught_up', 'true');
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    if (user?.id) {
      await supabase
        .from('profiles')
        .update({ last_read_notif_at: new Date().toISOString() })
        .eq('id', user.id);
    }
  };

  const filtered = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'read') return n.read;
    return true;
  });

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-5 pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400" /> Notifications
            </h1>
            <p className="text-xs text-zinc-400">New chapter drops and updates from followed series</p>
          </div>
        </div>

        {notifications.some((n) => !n.read) && (
          <button
            onClick={markAllRead}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
          >
            <Check className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>

      {/* Tabs: All / Unread / Read */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        {(['all', 'unread', 'read'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition ${
              activeTab === tab
                ? 'bg-zinc-800 text-white font-black'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-zinc-500 font-bold uppercase tracking-wider">
          Loading notifications...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 rounded-3xl bg-zinc-900/60 border border-dashed border-white/10 text-center space-y-3">
          <Bell className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="text-xs text-zinc-400 font-semibold">
            {activeTab === 'unread' ? "You're all caught up. No unread notifications." : "No notifications found."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => (
            <Link
              key={n.id}
              href={`/series/${n.mediaId}`}
              className={`p-3 rounded-2xl border flex items-center gap-3.5 transition group ${
                !n.read 
                  ? 'bg-indigo-500/10 border-indigo-500/30' 
                  : 'bg-zinc-900/60 border-white/5 opacity-75 hover:opacity-100'
              }`}
            >
              <img
                src={n.cover_url || '/placeholder.svg'}
                alt=""
                className="w-10 h-14 object-cover rounded-xl bg-zinc-800 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-zinc-200 group-hover:text-indigo-400 truncate transition">
                  {n.title}
                </p>
                <p className="text-[11px] text-zinc-400">
                  <span className="font-bold text-emerald-400">{n.unitLabel}</span> dropped • {n.timestamp}
                </p>
              </div>
              {!n.read && (
                <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
