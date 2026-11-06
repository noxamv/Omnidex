'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Newspaper } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type News = {
  id: number; title: string; excerpt: string | null; url: string; source: string;
  media_type: string | null; media_id: string | null; published_at: string;
};

const FILTERS = [
  { key: 'all', label: 'All' }, { key: 'anime', label: 'Anime' }, { key: 'manga', label: 'Manga' },
  { key: 'manhwa', label: 'Manhwa' }, { key: 'manhua', label: 'Manhua' }, { key: 'novel', label: 'Novels' },
];
const PAGE = 20;

const ago = (iso: string) => {
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
};

const safeUrl = (u: string) => (/^https?:\/\//i.test(u) ? u : '#');

export default function NewsPage() {
  const [items, setItems] = useState<News[]>([]);
  const [type, setType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(true);

  const load = async (reset: boolean) => {
    setLoading(true);
    const from = reset ? 0 : items.length;
    let q = supabase.from('news_items')
      .select('id,title,excerpt,url,source,media_type,media_id,published_at')
      .order('published_at', { ascending: false })
      .range(from, from + PAGE - 1);
    if (type !== 'all') q = q.eq('media_type', type);
    const { data } = await q;
    const rows = (data || []) as News[];
    setItems(reset ? rows : [...items, ...rows]);
    setMore(rows.length === PAGE);
    setLoading(false);
  };

  useEffect(() => { load(true); /* eslint-disable-next-line */ }, [type]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/" aria-label="Back" className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white"><ArrowLeft className="w-4 h-4" /></Link>
        <h1 className="text-lg font-black text-white flex items-center gap-2"><Newspaper className="w-5 h-5 text-amber-400" /> News</h1>
      </div>
      <p className="text-xs text-zinc-500">Headlines from news sites and communities. Each story opens on the original source.</p>

      <div className="flex gap-2 overflow-x-auto -mx-4 px-4">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setType(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition ${type === f.key ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <ul className="space-y-3">
        {items.map((n) => (
          <li key={n.id} className="p-4 rounded-2xl bg-zinc-900/60 border border-white/[0.06] space-y-1.5">
            <div className="flex items-center gap-2 text-[11px] text-zinc-500">
              <span className="font-bold text-amber-400">{n.source}</span><span>·</span><span>{ago(n.published_at)}</span>
              {n.media_type && <span className="ml-auto uppercase tracking-wide">{n.media_type}</span>}
            </div>
            <a href={safeUrl(n.url)} target="_blank" rel="noopener noreferrer nofollow" className="block text-sm font-bold text-zinc-100 hover:text-indigo-300">
              {n.title} <ExternalLink className="inline w-3 h-3 ml-0.5 opacity-60" />
            </a>
            {n.excerpt && <p className="text-xs text-zinc-400 line-clamp-3">{n.excerpt}</p>}
            {n.media_id && <Link href={`/series/${encodeURIComponent(n.media_id)}`} className="inline-block text-[11px] font-bold text-indigo-400 hover:text-indigo-300">View series →</Link>}
          </li>
        ))}
      </ul>

      {!loading && items.length === 0 && <p className="text-center text-sm text-zinc-500 py-10">No news yet. The news bot runs every few hours.</p>}
      {loading && <p className="text-center text-xs text-zinc-500">Loading...</p>}
      {!loading && more && items.length > 0 && (
        <button onClick={() => load(false)} className="w-full py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white">Load more</button>
      )}
    </div>
  );
}
