// app/import-export/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, RefreshCw, Upload, Download, ShieldCheck } from 'lucide-react';

const STATUS_MAP: Record<string, string> = {
  CURRENT: 'reading', REPEATING: 'reading', COMPLETED: 'completed',
  PAUSED: 'on_hold', DROPPED: 'dropped', PLANNING: 'plan_to_read',
};
const VALID_STATUS = ['reading', 'completed', 'plan_to_read', 'on_hold', 'dropped'];
const MAX_ROWS = 5000;

type Row = { media_id: string; progress: number; status: string; rating: number | null; is_following: boolean };

const chunk = <T,>(arr: T[], n: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};

const LIST_QUERY = `
  query ($userName: String, $type: MediaType) {
    MediaListCollection(userName: $userName, type: $type) {
      lists { entries { status progress score(format: POINT_10) media { id } } }
    }
  }`;

async function fetchAniList(userName: string, type: 'ANIME' | 'MANGA') {
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query: LIST_QUERY, variables: { userName, type } }),
  });
  const json = await res.json();
  if (json?.errors?.length) throw new Error('AniList could not read that list. Check the username and that the list is public.');
  return (json?.data?.MediaListCollection?.lists || []).flatMap((l: any) => l.entries || []);
}

export default function ImportExportPage() {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
  }, []);

  // Turn AniList ids into our own catalog ids (our rows may be md-, kt- or al- ids).
  const resolveAniListIds = async (alIds: number[]) => {
    const map = new Map<number, string>();
    for (const part of chunk(alIds, 100)) {
      const { data } = await supabase.from('media_catalog').select('id, al_id').in('al_id', part);
      for (const r of data || []) {
        const cur = map.get(r.al_id);
        if (!cur || (cur.startsWith('al-') && !r.id.startsWith('al-'))) map.set(r.al_id, r.id);
      }
    }
    return map;
  };

  // Signed in: save to the account. Guest: save on this device.
  const saveRows = async (rows: Row[]) => {
    if (user) {
      for (const part of chunk(rows, 200)) {
        const { error } = await supabase.from('user_tracker').upsert(
          part.map((r) => ({ ...r, user_id: user.id, updated_at: new Date().toISOString() })),
          { onConflict: 'user_id,media_id' }
        );
        if (error) throw new Error(error.message.includes('limit') ? 'Library limit reached (5000 series).' : 'Could not save part of your library.');
      }
    } else {
      const guest: any[] = JSON.parse(localStorage.getItem('omnidex_guest_library') || '[]');
      for (const r of rows) {
        const entry = { id: r.media_id, progress: r.progress, status: r.status, rating: r.rating ?? 0 };
        const i = guest.findIndex((g) => g.id === r.media_id);
        if (i >= 0) guest[i] = entry; else guest.push(entry);
      }
      localStorage.setItem('omnidex_guest_library', JSON.stringify(guest));
    }
  };

  const handleAniList = async () => {
    const name = username.trim();
    if (!name) return;
    setLoading(true); setMessage(null);
    try {
      const [anime, manga] = await Promise.all([fetchAniList(name, 'ANIME'), fetchAniList(name, 'MANGA')]);
      const byAl = new Map<number, any>();
      for (const e of [...anime, ...manga]) if (e?.media?.id && !byAl.has(e.media.id)) byAl.set(e.media.id, e);
      if (!byAl.size) { setMessage('No titles found. Is the AniList list public?'); return; }

      const idMap = await resolveAniListIds([...byAl.keys()]);
      const rows: Row[] = [];
      for (const [alId, e] of byAl) {
        const mediaId = idMap.get(alId);
        if (!mediaId) continue;
        rows.push({
          media_id: mediaId,
          progress: Math.min(Math.max(Number(e.progress) || 0, 0), 100000),
          status: STATUS_MAP[e.status] || 'plan_to_read',
          rating: e.score > 0 ? Math.min(Math.round(e.score), 10) : null,
          is_following: true,
        });
      }
      if (rows.length > MAX_ROWS) rows.length = MAX_ROWS;
      await saveRows(rows);
      const skipped = byAl.size - rows.length;
      setMessage(`✅ Imported ${rows.length} titles${skipped ? `. ${skipped} are not in our catalog yet and were skipped.` : '.'}${user ? '' : ' Saved on this device. Sign in to keep them across devices.'}`);
    } catch (e: any) {
      setMessage(`❌ ${e?.message || 'Import failed. Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (file: File) => {
    setLoading(true); setMessage(null);
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error('That file is too large.');
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed)) throw new Error('This does not look like an Omnidex backup.');

      const clean = new Map<string, Row>();
      for (const item of parsed.slice(0, MAX_ROWS)) {
        const id = String(item?.media_id ?? item?.id ?? '').slice(0, 80);
        if (!id) continue;
        const rating = Number(item?.rating);
        clean.set(id, {
          media_id: id,
          progress: Math.min(Math.max(Math.floor(Number(item?.progress) || 0), 0), 100000),
          status: VALID_STATUS.includes(item?.status) ? item.status : 'plan_to_read',
          rating: rating > 0 && rating <= 10 ? Math.round(rating) : null,
          is_following: item?.is_following !== false,
        });
      }
      const ids = [...clean.keys()];
      if (!ids.length) throw new Error('No library entries found in that file.');

      const existing = new Set<string>();
      for (const part of chunk(ids, 100)) {
        const { data } = await supabase.from('media_catalog').select('id').in('id', part);
        for (const r of data || []) existing.add(r.id);
      }
      const rows = ids.filter((id) => existing.has(id)).map((id) => clean.get(id)!);
      await saveRows(rows);
      const skipped = ids.length - rows.length;
      setMessage(`✅ Restored ${rows.length} titles${skipped ? `. ${skipped} no longer exist in the catalog and were skipped.` : '.'}`);
    } catch (e: any) {
      setMessage(`❌ ${e instanceof SyntaxError ? 'That file is not valid JSON.' : e?.message || 'Restore failed.'}`);
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleExport = async () => {
    let data: any[] = [];
    if (user) {
      const res = await supabase.from('user_tracker').select('media_id,progress,status,rating,is_following').eq('user_id', user.id);
      data = res.data || [];
    } else {
      data = JSON.parse(localStorage.getItem('omnidex_guest_library') || '[]');
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnidex_library_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage(`✅ Exported ${data.length} titles.`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 pb-24 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" aria-label="Back" className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-emerald-400" /> Import & Export
          </h1>
          <p className="text-xs text-zinc-400">Bring your library from AniList, or back it up and restore it.</p>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-zinc-300">
          {user ? 'Your progress is saved to your account automatically.' : 'You are not signed in, so your library is saved on this device only. Sign in to keep it everywhere.'}
        </p>
      </div>

      <div className="p-5 rounded-3xl bg-zinc-900/60 border border-white/10 space-y-3">
        <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Import from AniList</h2>
        <p className="text-[11px] text-zinc-500">Anime, manga, manhwa, manhua and novels on your public AniList list. Titles not in our catalog yet are skipped. MyAnimeList and MangaDex import are coming later.</p>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={40}
          placeholder="Your public AniList username"
          className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          onClick={handleAniList}
          disabled={loading || !username.trim()}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition"
        >
          {loading ? 'Working...' : 'Start AniList import'}
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="p-5 rounded-3xl bg-zinc-900/60 border border-white/10 space-y-3">
          <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> Export backup</h2>
          <p className="text-[11px] text-zinc-500">Download your library as a file.</p>
          <button onClick={handleExport} className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs transition">Download backup</button>
        </div>
        <div className="p-5 rounded-3xl bg-zinc-900/60 border border-white/10 space-y-3">
          <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5"><Upload className="w-3.5 h-3.5" /> Restore backup</h2>
          <p className="text-[11px] text-zinc-500">Load a backup file you saved earlier.</p>
          <input ref={fileRef} type="file" accept="application/json,.json" disabled={loading}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleRestore(f); }}
            className="w-full text-[11px] text-zinc-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-zinc-800 file:text-white file:font-bold" />
        </div>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-zinc-950 border border-white/10 text-xs font-semibold text-center text-zinc-200" role="status">
          {message}
        </div>
      )}
    </div>
  );
}
