'use client';

import { useCallback, useEffect, useState } from 'react';
import { MessageSquare, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Comment = { id: string; user_id: string | null; user_name: string; content: string; created_at: string };

export default function Comments({ mediaId, userId }: { mediaId: string; userId: string | null }) {
  const [items, setItems] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('media_comments')
      .select('id,user_id,user_name,content,created_at')
      .eq('media_id', mediaId)
      .order('created_at', { ascending: false })
      .limit(50);
    setItems((data || []) as Comment[]);
  }, [mediaId]);

  useEffect(() => { load(); }, [load]);

  const post = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || !userId) return;
    setBusy(true); setError('');
    const { error: err } = await supabase.from('media_comments').insert({ media_id: mediaId, user_id: userId, content });
    setBusy(false);
    if (err) { setError(err.message.includes('Slow down') ? 'You are posting too fast. Try again in a few minutes.' : 'Could not post your comment.'); return; }
    setText(''); load();
  };

  const remove = async (id: string) => {
    await supabase.from('media_comments').delete().eq('id', id);
    setItems((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <section className="space-y-3" aria-label="Comments">
      <h2 className="text-xs font-black uppercase tracking-wider text-zinc-200 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-indigo-400" /> Comments ({items.length})
      </h2>

      {userId ? (
        <form onSubmit={post} className="space-y-2">
          <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} rows={3}
            placeholder="Share your thoughts (no spoilers without a warning)"
            className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500" />
          {error && <p className="text-xs text-rose-400" role="alert">{error}</p>}
          <button disabled={busy || !text.trim()} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-black text-white">
            {busy ? 'Posting...' : 'Post comment'}
          </button>
        </form>
      ) : (
        <p className="text-xs text-zinc-500">Sign in to join the discussion.</p>
      )}

      <ul className="space-y-2">
        {items.map((c) => (
          <li key={c.id} className="p-3 rounded-xl bg-zinc-900/60 border border-white/[0.06]">
            <div className="flex items-center justify-between text-[11px] text-zinc-500">
              <span className="font-bold text-zinc-300">{c.user_name}</span>
              <span className="flex items-center gap-2">
                {new Date(c.created_at).toLocaleDateString()}
                {userId && c.user_id === userId && (
                  <button onClick={() => remove(c.id)} aria-label="Delete comment" className="text-zinc-500 hover:text-rose-400"><Trash2 className="w-3 h-3" /></button>
                )}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-300 whitespace-pre-wrap break-words">{c.content}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
