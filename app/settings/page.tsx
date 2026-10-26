// app/settings/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Settings } from 'lucide-react';

export default function SettingsPage() {
  const [continueReading, setContinueReading] = useState(true);
  const [newChapterAlerts, setNewChapterAlerts] = useState(true);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-5 pb-20 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-white">Settings</h1>
          <p className="text-xs text-zinc-400">Preferences for homepage display and alerts</p>
        </div>
      </div>

      <div className="p-5 rounded-3xl bg-zinc-900/60 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-white">Show Continue Reading Shelf</p>
            <p className="text-[11px] text-zinc-400">Display active tracked series on homepage</p>
          </div>
          <button
            onClick={() => setContinueReading(!continueReading)}
            className={`w-12 h-6 rounded-full transition p-1 ${continueReading ? 'bg-indigo-600' : 'bg-zinc-800'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition ${continueReading ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 pt-4">
          <div>
            <p className="text-xs font-bold text-white">New Chapter Notifications</p>
            <p className="text-[11px] text-zinc-400">Receive alerts when tracked series drop new units</p>
          </div>
          <button
            onClick={() => setNewChapterAlerts(!newChapterAlerts)}
            className={`w-12 h-6 rounded-full transition p-1 ${newChapterAlerts ? 'bg-indigo-600' : 'bg-zinc-800'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition ${newChapterAlerts ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
