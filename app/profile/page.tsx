// app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, User, Check, Sparkles } from 'lucide-react';

const AVATAR_COLLECTION = [
  // 1-5: Anime Icons
  { name: 'Ichigo', cat: 'Anime', url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=160&h=160&fit=crop' },
  { name: 'Gojo', cat: 'Anime', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=160&h=160&fit=crop' },
  { name: 'Luffy', cat: 'Anime', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=160&h=160&fit=crop' },
  { name: 'Tanjiro', cat: 'Anime', url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=160&h=160&fit=crop' },
  { name: 'Frieren', cat: 'Anime', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=160&h=160&fit=crop' },

  // 6-10: Korean Manhwa / Webtoons
  { name: 'Jin-woo', cat: 'Manhwa', url: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=160&h=160&fit=crop' },
  { name: 'Dokja', cat: 'Manhwa', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop' },
  { name: 'Lloyd', cat: 'Manhwa', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop' },
  { name: 'Arthur', cat: 'Manhwa', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=160&h=160&fit=crop' },
  { name: 'Daniel', cat: 'Manhwa', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=160&h=160&fit=crop' },

  // 11-15: Chinese Manhua / Cultivation
  { name: 'Luo Zheng', cat: 'Manhua', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=160&h=160&fit=crop' },
  { name: 'Nie Li', cat: 'Manhua', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&h=160&fit=crop' },
  { name: 'Fang Yuan', cat: 'Manhua', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop' },
  { name: 'Chen Fan', cat: 'Manhua', url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=160&h=160&fit=crop' },
  { name: 'Xiao Yan', cat: 'Manhua', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop' },

  // 16-20: Web & Light Novels
  { name: 'Klein', cat: 'Novel', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&h=160&fit=crop' },
  { name: 'Sunny', cat: 'Novel', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=160&h=160&fit=crop' },
  { name: 'Ainz', cat: 'Novel', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&h=160&fit=crop' },
  { name: 'Rudeus', cat: 'Novel', url: 'https://images.unsplash.com/photo-1528892952291-009c663ce843?w=160&h=160&fit=crop' },
  { name: 'Cale', cat: 'Novel', url: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=160&h=160&fit=crop' },
];

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_COLLECTION[0].url);
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const activeUser = session?.user ?? null;
      setUser(activeUser);
      if (activeUser) {
        setDisplayName(activeUser.email?.split('@')[0] || '');
        supabase
          .from('profiles')
          .select('avatar_url, display_name')
          .eq('id', activeUser.id)
          .single()
          .then(({ data }) => {
            if (data?.avatar_url) setSelectedAvatar(data.avatar_url);
            if (data?.display_name) setDisplayName(data.display_name);
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

    // Broadcast instant event to AppShell
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('omnidex_avatar_changed', { detail: { url: selectedAvatar } }));
    }

    if (user?.id) {
      await supabase.from('profiles').upsert({
        id: user.id,
        avatar_url: selectedAvatar,
        display_name: displayName.trim(),
        updated_at: new Date().toISOString(),
      });
    }

    setSaving(false);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-5 pb-20 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-white">Edit Profile</h1>
          <p className="text-xs text-zinc-400">Choose your avatar from 20 iconic characters</p>
        </div>
      </div>

      <div className="p-5 rounded-3xl bg-zinc-900/60 border border-white/10 space-y-6 backdrop-blur-xl">
        {/* 20 Avatars Matrix */}
        <div>
          <label className="text-xs font-black text-zinc-300 uppercase tracking-wider block mb-3">
            Choose Character Avatar (20 Options):
          </label>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2.5">
            {AVATAR_COLLECTION.map((av, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedAvatar(av.url)}
                className={`aspect-square rounded-2xl overflow-hidden border-2 transition relative group ${
                  selectedAvatar === av.url ? 'border-indigo-500 scale-105 shadow-lg shadow-indigo-500/20' : 'border-white/10 opacity-70 hover:opacity-100'
                }`}
                title={`${av.name} (${av.cat})`}
              >
                <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                {selectedAvatar === av.url && (
                  <span className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-indigo-500 border border-white" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Display Name Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">Display Username:</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter public reading name"
            className="w-full p-2.5 rounded-xl bg-zinc-950 border border-white/10 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Email Address */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">Authentication Email:</label>
          <input
            disabled
            value={user?.email || 'Guest Visitor (Cloud Sync available upon sign in)'}
            className="w-full p-2.5 rounded-xl bg-zinc-950 border border-white/5 text-xs text-zinc-500 cursor-not-allowed"
          />
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-600/30"
        >
          {savedToast ? <Check className="w-4 h-4 text-emerald-400" /> : <Sparkles className="w-4 h-4" />}
          <span>{savedToast ? 'Profile Avatar Saved!' : saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>
    </div>
  );
}
