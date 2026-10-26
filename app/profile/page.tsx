// app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, User, Check, Sparkles } from 'lucide-react';

const AVATAR_OPTIONS = [
  'https://cdn.myanimelist.net/images/characters/8/531267.jpg',
  'https://cdn.myanimelist.net/images/characters/5/292491.jpg',
  'https://cdn.myanimelist.net/images/characters/5/72194.jpg',
  'https://cdn.myanimelist.net/images/characters/11/496739.jpg',
  'https://cdn.myanimelist.net/images/characters/4/488583.jpg',
];

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      const localAvatar = localStorage.getItem('omnidex_user_avatar');
      if (localAvatar) setSelectedAvatar(localAvatar);
    });
  }, []);

  const handleSave = () => {
    localStorage.setItem('omnidex_user_avatar', selectedAvatar);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-5 pb-20 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-white">Edit Profile</h1>
          <p className="text-xs text-zinc-400">Manage account avatar and reading identity</p>
        </div>
      </div>

      <div className="p-5 rounded-3xl bg-zinc-900/60 border border-white/10 space-y-5">
        <div>
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-2">Select Avatar:</label>
          <div className="flex gap-3">
            {AVATAR_OPTIONS.map((url) => (
              <button
                key={url}
                onClick={() => setSelectedAvatar(url)}
                className={`w-14 h-14 rounded-2xl overflow-hidden border-2 transition ${
                  selectedAvatar === url ? 'border-indigo-500 scale-105' : 'border-white/10 opacity-70'
                }`}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">Email Account:</label>
          <input
            disabled
            value={user?.email || 'Guest User (Not logged in)'}
            className="w-full p-2.5 rounded-xl bg-zinc-950 border border-white/10 text-xs text-zinc-400"
          />
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-xs rounded-xl transition flex items-center gap-1.5"
        >
          {saved ? <Check className="w-4 h-4 text-emerald-400" /> : <Sparkles className="w-4 h-4" />}
          <span>{saved ? 'Saved Profile!' : 'Save Changes'}</span>
        </button>
      </div>
    </div>
  );
}
