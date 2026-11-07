'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function DeleteAccount() {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const remove = async () => {
    setBusy(true); setMsg('');
    const { error } = await supabase.rpc('delete_my_account');
    if (error) { setBusy(false); setMsg('Could not delete the account. Make sure you are signed in.'); return; }
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16 space-y-4">
      <h1 className="text-xl font-black text-white">Delete my account</h1>
      <p className="text-sm text-zinc-400">This permanently deletes your library, progress, comments, reports and profile. It cannot be undone.</p>
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type DELETE to confirm"
        className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-sm text-zinc-100" />
      {msg && <p className="text-xs text-rose-400" role="alert">{msg}</p>}
      <button onClick={remove} disabled={busy || text !== 'DELETE'}
        className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-sm font-black text-white">
        {busy ? 'Deleting...' : 'Delete everything'}
      </button>
    </div>
  );
}
