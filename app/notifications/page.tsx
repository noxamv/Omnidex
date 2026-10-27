// app/notifications/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, Check, Sparkles } from 'lucide-react';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all');
  const [notifs, setNotifs] = useState([
    { id: 1, title: 'Solo Leveling: Ragnarok', chapter: 'Chapter 28', time: '2 hours ago', read: false },
    { id: 2, title: 'Lord of the Mysteries', chapter: 'Volume 6: Lightseeker', time: '1 day ago', read: false },
    { id: 3, title: 'Frieren: Beyond Journey\'s End', chapter: 'Chapter 134', time: '3 days ago', read: true },
  ]);

  const markAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const filtered = notifs.filter((n) => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'read') return n.read;
    return true;
  });

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-5 pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400" /> Notifications
            </h1>
            <p className="text-xs text-zinc-400">New chapter drops and airing updates from your followed titles</p>
          </div>
        </div>

        <button
          onClick={markAllRead}
          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
        >
          <Check className="w-3.5 h-3.5" /> Mark all as read
        </button>
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

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="p-12 rounded-3xl bg-zinc-900/60 border border-dashed border-white/10 text-center space-y-2">
            <Bell className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-xs text-zinc-400 font-semibold">No notifications found on this tab.</p>
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              className={`p-3.5 rounded-2xl border flex items-center justify-between transition ${
                !n.read ? 'bg-indigo-500/10 border-indigo-500/20 text-white' : 'bg-zinc-900/60 border-white/5 text-zinc-400'
              }`}
            >
              <div className="space-y-0.5">
                <p className="text-xs font-black text-zinc-200">{n.title}</p>
                <p className="text-[11px] text-zinc-400">{n.chapter} has officially released • {n.time}</p>
              </div>
              {!n.read && (
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
