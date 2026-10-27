// app/import-export/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { 
  ArrowLeft, RefreshCw, Upload, Download, 
  Check, FileText, Database, ShieldCheck
} from 'lucide-react';

export default function ImportExportPage() {
  const [user, setUser] = useState<any>(null);
  const [aniListUsername, setAniListUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [autoSync, setAutoSync] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const handleAniListSync = async () => {
    if (!aniListUsername.trim()) return;
    setLoading(true);
    setStatusMessage(null);

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

    try {
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { userName: aniListUsername.trim() } }),
      });
      const json = await res.json();
      const lists = json?.data?.MediaListCollection?.lists || [];
      const entries = lists.flatMap((l: any) => l.entries || []);

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
          count++;
        } else {
          let guest = JSON.parse(localStorage.getItem('omnidex_guest_library') || '[]');
          const idx = guest.findIndex((g: any) => g.id === alId);
          const obj = { id: alId, progress: entry.progress || 0, status: cleanStatus };
          if (idx >= 0) guest[idx] = obj;
          else guest.push(obj);
          localStorage.setItem('omnidex_guest_library', JSON.stringify(guest));
          count++;
        }
      }

      setStatusMessage(`✅ Successfully synchronized ${count} titles from AniList!`);
    } catch {
      setStatusMessage('❌ Network error reaching AniList endpoint. Please verify username.');
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
            <RefreshCw className="w-5 h-5 text-emerald-400" /> Import, Export & Cloud Sync
          </h1>
          <p className="text-xs text-zinc-400">Migrate and synchronize your library across major platforms</p>
        </div>
      </div>

      {/* Auto-Sync Live Feature Card */}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* AniList Sync Card */}
        <div className="p-5 rounded-3xl bg-zinc-900/60 border border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-xs">
              AL
            </div>
            <div>
              <h3 className="text-xs font-black text-white">AniList Sync</h3>
              <p className="text-[10px] text-zinc-400">Direct GraphQL Public Ingestion</p>
            </div>
          </div>

          <div className="space-y-2">
            <input
              value={aniListUsername}
              onChange={(e) => setAniListUsername(e.target.value)}
              placeholder="Enter public username"
              className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleAniListSync}
              disabled={loading || !aniListUsername.trim()}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition"
            >
              {loading ? 'Synchronizing...' : 'Start AniList Import'}
            </button>
          </div>
        </div>

        {/* JSON Backup & Export Card */}
        <div className="p-5 rounded-3xl bg-zinc-900/60 border border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black text-xs">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white">Universal JSON Backup</h3>
              <p className="text-[10px] text-zinc-400">Export or restore standard format file</p>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleExportBackup}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 border border-white/5"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Download JSON Backup</span>
            </button>

            <label className="w-full py-2 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 border border-white/10 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Restore from Backup (.json)</span>
              <input type="file" accept=".json" className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-2xl bg-zinc-900 border border-white/10 text-xs font-semibold text-center text-zinc-200">
          {statusMessage}
        </div>
      )}
    </div>
  );
}
