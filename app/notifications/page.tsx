// app/notifications/page.tsx
'use client';

import Link from 'next/link';
import { ArrowLeft, Bell, Sparkles } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-5 pb-20 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-white">Notifications</h1>
          <p className="text-xs text-zinc-400">Releases and chapter drops from followed titles</p>
        </div>
      </div>

      <div className="p-10 rounded-3xl bg-zinc-900/60 border border-dashed border-white/10 text-center space-y-3">
        <Bell className="w-8 h-8 text-zinc-600 mx-auto" />
        <p className="text-xs text-zinc-400 font-semibold">No unread chapter releases for your tracked series.</p>
      </div>
    </div>
  );
}
