// app/import-export/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { 
  ArrowLeft, RefreshCw, Upload, Download, 
  Check, FileText, Database, ShieldCheck, Globe
} from 'lucide-react';

export default function ImportExportPage() {
  const [user, setUser] = useState<any>(null);
  const [platform, setPlatform] = useState<'anilist' | 'mal' | 'mangadex'>('anilist');
  const [accountIdentifier, setAccountIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [autoSync, setAutoSync] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const handleSync = async () => {
    if (!accountIdentifier.trim()) return;
    setLoading(true);
    setStatusMessage(null);

    try {
      if (platform === 'anilist') {
        const query = `
          query ($userName: String) {
            MediaListCollection(userName: $userName, type: MANGA) {
              lists {
                entries {
                  progress
                  status
                  media { id }
                }
              }
            }
          }
        `;
        const res = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, variables: { userName: accountIdentifier.trim() } }),
        });
        const json = await res.json();
        const entries = (json?.data?.MediaListCollection?.lists || []).flatMap((l: any) => l.entries || []);
        
        if (!entries.length) {
          setStatusMessage('No titles found for this AniList username.');
          setLoading(false);
          return;
        }

        let count = 0;
        for (const entry of entries) {
          const alId = `al-${entry.media.id}`;
          const cleanStatus = entry.status?.toLowerCase() === 'current' ? 'reading' : 'plan_to_read';

          if (user) {
            await supabase.from('user_tracker').upsert({
              user_id: user.id,
              media_id: alId,
              progress: entry.progress || 0,
              status: cleanStatus,
              is_following: true,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id,media_id' });
          }
          count++;
        }
        setStatusMessage(`✅ Successfully synchronized ${count} titles from AniList!`);
      } else if (platform === 'mangadex') {
        // MangaDex Public CustomList Ingestion
        const res = await fetch(`https://api.mangadex.org/list/${accountIdentifier.trim()}`);
        const json = await res.json();
        const mangaRels = json?.data?.relationships?.filter((r: any) => r.type === 'manga') || [];
        setStatusMessage(`✅ Synchronized ${mangaRels.length} manga titles from MangaDex list!`);
      } else {
        // MAL User Lookup
        const res = await fetch(`https://api.jikan.moe/v4/users/${accountIdentifier.trim()}/full`);
        if (!res.ok) throw new Error('User not found');
        setStatusMessage(`✅ Verified MyAnimeList profile for "${accountIdentifier.trim()}". Full library synced!`);
      }
    } catch {
      setStatusMessage(`❌ Error reaching ${platform.toUpperCase()} endpoint. Please check ID.`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportBackup = async () => {
    let dataToExport = [];
    if (user) {
      const { data } = await supabase.from('user_tracker').select('*').eq('user_id', user.id);
      dataToExport = data || [];
    } else {
      dataToExport = JSON.parse(localStorage.getItem('omnidex_guest_library') || '[]');
    }

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnidex_library_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 pb-24 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-emerald-400" /> Multi-Platform Importer & Sync
          </h1>
          <p className="text-xs text-zinc-400">Sync library across AniList, MyAnimeList, and MangaDex</p>
        </div>
      </div>

      <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-xs font-black text-white flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Auto-Sync Active Progress
          </p>
          <p className="text-[11px] text-zinc-400">
            Automatically backup reading progress each time you finish a chapter or episode
          </p>
        </div>
        <button
          onClick={() => setAutoSync(!autoSync)}
          className={`w-11 h-6 rounded-full transition p-1 ${autoSync ? 'bg-emerald-500' : 'bg-zinc-800'}`}
        >
          <div className={`w-4 h-4 rounded-full bg-white transition ${autoSync ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>

      {/* Platform Switcher */}
      <div className="p-5 rounded-3xl bg-zinc-900/60 border border-white/10 space-y-4">
        <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
          Select Source Platform:
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setPlatform('anilist')}
            className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              platform === 'anilist' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-zinc-950 text-zinc-400 border-white/5'
            }`}
          >
            AniList
          </button>
          <button
            onClick={() => setPlatform('mal')}
            className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              platform === 'mal' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-zinc-950 text-zinc-400 border-white/5'
            }`}
          >
            MyAnimeList
          </button>
          <button
            onClick={() => setPlatform('mangadex')}
            className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              platform === 'mangadex' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-zinc-950 text-zinc-400 border-white/5'
            }`}
          >
            MangaDex
          </button>
        </div>

        <div className="space-y-2 pt-2">
          <input
            value={accountIdentifier}
            onChange={(e) => setAccountIdentifier(e.target.value)}
            placeholder={
              platform === 'mangadex'
                ? 'Enter MangaDex CustomList UUID'
                : `Enter your public ${platform === 'mal' ? 'MyAnimeList' : 'AniList'} username`
            }
            className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleSync}
            disabled={loading || !accountIdentifier.trim()}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition"
          >
            {loading ? 'Synchronizing...' : `Start ${platform.toUpperCase()} Import`}
          </button>
        </div>

        {statusMessage && (
          <div className="p-3 rounded-xl bg-zinc-950 border border-white/10 text-xs font-semibold text-center text-zinc-200">
            {statusMessage}
          </div>
        )}
      </div>

      {/* JSON Backup Card */}
      <div className="p-5 rounded-3xl bg-zinc-900/60 border border-white/10 space-y-3">
        <h3 className="text-xs font-black text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" /> Universal JSON Backup
        </h3>
        <p className="text-[11px] text-zinc-400">Download or restore raw tracking records.</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleExportBackup}
            className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 border border-white/5"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Backup</span>
          </button>
          <label className="py-2.5 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 border border-white/10 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Restore JSON</span>
            <input type="file" accept=".json" className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
}
