// app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Check, Sparkles, ShieldCheck } from 'lucide-react';

const proxy = (url: string) => `/api/proxy?url=${encodeURIComponent(url)}`;

// 20 Real Anime & Manhwa Character Illustrations via Next.js Edge Proxy
const HERO_AVATARS = [
  // 1-5: Anime Icons
  { name: 'Sung Jin-woo', series: 'Solo Leveling', url: proxy('https://cdn.myanimelist.net/images/characters/11/498424.jpg') },
  { name: 'Gojo Satoru', series: 'Jujutsu Kaisen', url: proxy('https://cdn.myanimelist.net/images/characters/15/422168.jpg') },
  { name: 'Ichigo Kurosaki', series: 'Bleach', url: proxy('https://cdn.myanimelist.net/images/characters/3/543160.jpg') },
  { name: 'Monkey D. Luffy', series: 'One Piece', url: proxy('https://cdn.myanimelist.net/images/characters/9/131317.jpg') },
  { name: 'Frieren', series: 'Frieren', url: proxy('https://cdn.myanimelist.net/images/characters/12/524859.jpg') },

  // 6-10: Korean Webtoons / Manhwa
  { name: 'Kim Dokja', series: 'Omniscient Reader', url: proxy('https://cdn.myanimelist.net/images/characters/16/410943.jpg') },
  { name: 'Lloyd Frontera', series: 'Greatest Estate Dev', url: proxy('https://cdn.myanimelist.net/images/characters/2/492211.jpg') },
  { name: 'Arthur Leywin', series: 'TBATE', url: proxy('https://cdn.myanimelist.net/images/characters/14/434789.jpg') },
  { name: 'Chung Myung', series: 'Return of Mount Hua', url: proxy('https://cdn.myanimelist.net/images/characters/7/482103.jpg') },
  { name: 'Daniel Park', series: 'Lookism', url: proxy('https://cdn.myanimelist.net/images/characters/8/491953.jpg') },

  // 11-15: Web & Light Novels
  { name: 'Klein Moretti', series: 'Lord of Mysteries', url: proxy('https://cdn.myanimelist.net/images/characters/4/528341.jpg') },
  { name: 'Sunny', series: 'Shadow Slave', url: proxy('https://cdn.myanimelist.net/images/characters/6/512933.jpg') },
  { name: 'Ainz Ooal Gown', series: 'Overlord', url: proxy('https://cdn.myanimelist.net/images/characters/6/289296.jpg') },
  { name: 'Cale Henituse', series: 'Trash of Counts', url: proxy('https://cdn.myanimelist.net/images/characters/13/462193.jpg') },
  { name: 'Zorian Kazinski', series: 'Mother of Learning', url: proxy('https://cdn.myanimelist.net/images/characters/10/487312.jpg') },

  // 16-20: Chinese Manhua / Cultivation
  { name: 'Luo Zheng', series: 'Apostle of Gods', url: proxy('https://cdn.myanimelist.net/images/characters/9/398214.jpg') },
  { name: 'Nie Li', series: 'Tales of Demons', url: proxy('https://cdn.myanimelist.net/images/characters/5/381290.jpg') },
  { name: 'Fang Yuan', series: 'Reverend Insanity', url: proxy('https://cdn.myanimelist.net/images/characters/12/460912.jpg') },
  { name: 'Xiao Yan', series: 'Battle Through Heavens', url: proxy('https://cdn.myanimelist.net/images/characters/11/365219.jpg') },
  { name: 'Tang San', series: 'Soul Land', url: proxy('https://cdn.myanimelist.net/images/characters/14/354029.jpg') },
];

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [selectedAvatar, setSelectedAvatar] = useState(HERO_AVATARS[0].url);
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const activeUser = session?.user ?? null;
      setUser(activeUser);
      if (activeUser) {
        setUsername(activeUser.email?.split('@')[0] || '');
        supabase
          .from('profiles')
          .select('avatar_url, display_name')
          .eq('id', activeUser.id)
          .single()
          .then(({ data }) => {
            if (data?.avatar_url) setSelectedAvatar(data.avatar_url);
            if (data?.display_name) setUsername(data.display_name);
          });
      } else {
        const local = localStorage.getItem('omnidex_user_avatar');
        if (local) setSelectedAvatar(local);
      }
    });
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    localStorage.setItem('omnidex_user_avatar', selectedAvatar);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('omnidex_avatar_changed', { detail: { url: selectedAvatar } }));
    }

    if (user?.id) {
      await supabase.from('profiles').upsert({
        id: user.id,
        avatar_url: selectedAvatar,
        display_name: username.trim(),
        updated_at: new Date().toISOString(),
      });
    }

    setSaving(false);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-5 pb-24 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-white">Edit Profile</h1>
          <p className="text-xs text-zinc-400">Choose your character avatar and public username</p>
        </div>
      </div>

      <div className="p-5 rounded-3xl bg-zinc-900/60 border border-white/10 space-y-6 backdrop-blur-xl shadow-2xl">
        {/* 20 Real Illustrated Character Avatars */}
        <div>
          <label className="text-xs font-black text-zinc-300 uppercase tracking-wider block mb-3">
            Character Avatar (20 Options):
          </label>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2.5">
            {HERO_AVATARS.map((av, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedAvatar(av.url)}
                className={`aspect-square rounded-2xl overflow-hidden border-2 transition relative bg-zinc-950 ${
                  selectedAvatar === av.url
                    ? 'border-indigo-500 scale-105 shadow-lg shadow-indigo-500/40 ring-2 ring-indigo-500/50'
                    : 'border-white/10 opacity-70 hover:opacity-100 hover:border-white/30'
                }`}
                title={`${av.name} (${av.series})`}
              >
                <img
                  src={av.url}
                  alt={av.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {selectedAvatar === av.url && (
                  <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border border-white" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Username Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">Username:</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="reader_name"
            className="w-full p-2.5 rounded-xl bg-zinc-950 border border-white/10 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Read-Only Magic Link Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">Authentication Email:</label>
          <input
            disabled
            value={user?.email || 'Guest Visitor (Cloud Sync activated upon sign in)'}
            className="w-full p-2.5 rounded-xl bg-zinc-950 border border-white/5 text-xs text-zinc-500 cursor-not-allowed"
          />
          <p className="text-[10px] text-zinc-500 flex items-center gap-1 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Authenticated via secure passwordless Magic Link.
          </p>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95"
        >
          {savedToast ? <Check className="w-4 h-4 text-emerald-400" /> : <Sparkles className="w-4 h-4" />}
          <span>{savedToast ? 'Profile Changes Saved!' : saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>
    </div>
  );
}
