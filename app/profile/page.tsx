// app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Check, Sparkles, User, ShieldCheck } from 'lucide-react';

const HERO_AVATARS = [
  { name: 'Sung Jin-woo', origin: 'Solo Leveling', url: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=160&h=160&fit=crop' },
  { name: 'Gojo Satoru', origin: 'Jujutsu Kaisen', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=160&h=160&fit=crop' },
  { name: 'Ichigo Kurosaki', origin: 'Bleach', url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=160&h=160&fit=crop' },
  { name: 'Monkey D. Luffy', origin: 'One Piece', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=160&h=160&fit=crop' },
  { name: 'Frieren', origin: 'Frieren', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=160&h=160&fit=crop' },
  { name: 'Kim Dokja', origin: 'ORV', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop' },
  { name: 'Lloyd Frontera', origin: 'Estate Developer', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop' },
  { name: 'Arthur Leywin', origin: 'TBATE', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=160&h=160&fit=crop' },
  { name: 'Daniel Park', origin: 'Lookism', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=160&h=160&fit=crop' },
  { name: 'Klein Moretti', origin: 'LOTM', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=160&h=160&fit=crop' },
  { name: 'Sunny', origin: 'Shadow Slave', url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=160&h=160&fit=crop' },
  { name: 'Zorian Kazinski', origin: 'Mother of Learning', url: 'https://images.unsplash.com/photo-1528892952291-009c663ce843?w=160&h=160&fit=crop' },
  { name: 'Ainz Ooal Gown', origin: 'Overlord', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&h=160&fit=crop' },
  { name: 'Cale Henituse', origin: 'Trash of Counts', url: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=160&h=160&fit=crop' },
  { name: 'Fang Yuan', origin: 'Reverend Insanity', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop' },
  { name: 'Xiao Yan', origin: 'Battle Through', url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=160&h=160&fit=crop' },
  { name: 'Nie Li', origin: 'Tales of Demons', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&h=160&fit=crop' },
  { name: 'Luo Zheng', origin: 'Apostle of Gods', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=160&h=160&fit=crop' },
  { name: 'Chung Myung', origin: 'Mount Hua', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=160&h=160&fit=crop' },
  { name: 'Chen Fan', origin: 'Urban Immortal', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&h=160&fit=crop' },
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
        <Link href="/" className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-white">Edit Profile</h1>
          <p className="text-xs text-zinc-400">Select your character avatar and public username</p>
        </div>
      </div>

      <div className="p-5 rounded-3xl bg-zinc-900/60 border border-white/10 space-y-5 backdrop-blur-xl shadow-2xl">
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
                className={`aspect-square rounded-2xl overflow-hidden border-2 transition relative ${
                  selectedAvatar === av.url ? 'border-indigo-500 scale-105 shadow-md shadow-indigo-500/30' : 'border-white/10 opacity-70 hover:opacity-100'
                }`}
                title={`${av.name} (${av.origin})`}
              >
                <img src={av.url} alt="" className="w-full h-full object-cover" />
                {selectedAvatar === av.url && (
                  <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border border-white" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">Username:</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="reader_name"
            className="w-full p-2.5 rounded-xl bg-zinc-950 border border-white/10 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">Authentication Email:</label>
          <input
            disabled
            value={user?.email || 'Guest Visitor (Cloud Sync activated upon sign in)'}
            className="w-full p-2.5 rounded-xl bg-zinc-950 border border-white/5 text-xs text-zinc-500 cursor-not-allowed"
          />
          <p className="text-[10px] text-zinc-500 flex items-center gap-1 pt-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Authenticated via secure passwordless Magic Link.
          </p>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-600/30"
        >
          {savedToast ? <Check className="w-4 h-4 text-emerald-400" /> : <Sparkles className="w-4 h-4" />}
          <span>{savedToast ? 'Profile Changes Saved!' : saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>
    </div>
  );
}
