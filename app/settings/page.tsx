// app/settings/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Settings, Shield, Globe, ExternalLink, Sliders } from 'lucide-react';

export default function SettingsPage() {
  const [continueReading, setContinueReading] = useState(true);
  const [newChapterAlerts, setNewChapterAlerts] = useState(true);
  const [safeMode, setSafeMode] = useState(true);
  const [showRawLinks, setShowRawLinks] = useState(true);
  const [preferFreeSources, setPreferFreeSources] = useState(true);
  const [contentLanguage, setContentLanguage] = useState('en');

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-5 pb-24 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" /> Platform Settings
          </h1>
          <p className="text-xs text-zinc-400">Configure reading sources, languages and discovery</p>
        </div>
      </div>

      <div className="p-5 rounded-3xl bg-zinc-900/60 border border-white/10 space-y-5 backdrop-blur-xl">
        {/* Language Preference */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-400" /> Primary Reading Language
            </p>
            <p className="text-[11px] text-zinc-400">Prioritize links in this language</p>
          </div>
          <select
            value={contentLanguage}
            onChange={(e) => setContentLanguage(e.target.value)}
            className="bg-zinc-950 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-zinc-200 font-bold focus:outline-none"
          >
            <option value="en">English Simulpub</option>
            <option value="kr">Korean (Raw / Original)</option>
            <option value="jp">Japanese (Raw / Original)</option>
            <option value="cn">Chinese (Raw / Original)</option>
          </select>
        </div>

        {/* Free vs Paid Routing */}
        <div className="flex items-center justify-between border-t border-white/5 pt-4">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" /> Prefer Free Legal Publishers
            </p>
            <p className="text-[11px] text-zinc-400">Default to MangaPlus, Crunchyroll Free & Webtoons</p>
          </div>
          <button
            onClick={() => setPreferFreeSources(!preferFreeSources)}
            className={`w-11 h-6 rounded-full transition p-1 ${preferFreeSources ? 'bg-indigo-600' : 'bg-zinc-800'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition ${preferFreeSources ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Raw Links Display */}
        <div className="flex items-center justify-between border-t border-white/5 pt-4">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" /> Show Native Publisher Links
            </p>
            <p className="text-[11px] text-zinc-400">Display Naver Series, KakaoPage and Shonen Jump+ raws</p>
          </div>
          <button
            onClick={() => setShowRawLinks(!showRawLinks)}
            className={`w-11 h-6 rounded-full transition p-1 ${showRawLinks ? 'bg-indigo-600' : 'bg-zinc-800'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition ${showRawLinks ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Safe Mode */}
        <div className="flex items-center justify-between border-t border-white/5 pt-4">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-rose-400" /> Safe Mode (Hide Mature / Ecchi)
            </p>
            <p className="text-[11px] text-zinc-400">Filter explicit content from discovery shelves</p>
          </div>
          <button
            onClick={() => setSafeMode(!safeMode)}
            className={`w-11 h-6 rounded-full transition p-1 ${safeMode ? 'bg-indigo-600' : 'bg-zinc-800'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition ${safeMode ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Homepage Shelf Toggles */}
        <div className="flex items-center justify-between border-t border-white/5 pt-4">
          <div>
            <p className="text-xs font-bold text-white">Show Continue Reading Shelf</p>
            <p className="text-[11px] text-zinc-400">Display active reading tray on homepage</p>
          </div>
          <button
            onClick={() => setContinueReading(!continueReading)}
            className={`w-11 h-6 rounded-full transition p-1 ${continueReading ? 'bg-indigo-600' : 'bg-zinc-800'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition ${continueReading ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
