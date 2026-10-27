// app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Check, Sparkles, ShieldCheck } from 'lucide-react';

// Generates an inline, unblockable SVG illustrated character avatar
function makeAvatarSvg(bgGradient: string, accentColor: string, eyeGlow: string, hairPath: string, faceAcc: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgGradient.split(',')[0]}"/>
        <stop offset="100%" stop-color="${bgGradient.split(',')[1]}"/>
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <rect width="100" height="100" rx="28" fill="url(#g)"/>
    <!-- Cloak / Shoulders -->
    <path d="M 18 100 Q 50 68 82 100 Z" fill="#0d1117" opacity="0.95"/>
    <path d="M 28 100 Q 50 78 72 100 Z" fill="${accentColor}" opacity="0.8"/>
    <!-- Neck & Face -->
    <rect x="43" y="55" width="14" height="18" rx="4" fill="#fcd3b0"/>
    <path d="M 32 38 Q 50 25 68 38 Q 68 62 50 72 Q 32 62 32 38 Z" fill="#fcd3b0"/>
    <!-- Hair Base -->
    ${hairPath}
    <!-- Eyes -->
    <ellipse cx="42" cy="46" rx="4.5" ry="3.5" fill="#18181b"/>
    <ellipse cx="58" cy="46" rx="4.5" ry="3.5" fill="#18181b"/>
    <circle cx="42" cy="46" r="2.5" fill="${eyeGlow}" filter="url(#glow)"/>
    <circle cx="58" cy="46" r="2.5" fill="${eyeGlow}" filter="url(#glow)"/>
    <circle cx="43" cy="45" r="0.8" fill="#ffffff"/>
    <circle cx="59" cy="45" r="0.8" fill="#ffffff"/>
    <!-- Mouth -->
    <path d="M 46 61 Q 50 63 54 61" stroke="#a16207" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    <!-- Face Accessory / Unique Trait -->
    ${faceAcc}
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// 20 Unique Illustrated Characters Across Anime, Manhwa, Manhua, and Novels (internal constant, not exported)
const HERO_AVATARS = [
  // 1. Sung Jin-woo (Solo Leveling)
  {
    name: 'Sung Jin-woo',
    series: 'Solo Leveling',
    url: makeAvatarSvg('#090d16,#1e1b4b', '#3b82f6', '#60a5fa', 
      '<path d="M 28 35 Q 38 10 65 14 Q 74 22 72 42 Q 62 25 48 24 Q 35 25 28 35 Z" fill="#0f172a"/>', 
      '<path d="M 38 48 Q 42 54 44 48" stroke="#3b82f6" stroke-width="1" fill="none"/>')
  },
  // 2. Gojo Satoru (Jujutsu Kaisen)
  {
    name: 'Gojo Satoru',
    series: 'JJK',
    url: makeAvatarSvg('#030712,#1f2937', '#6366f1', '#38bdf8',
      '<path d="M 24 35 Q 32 6 52 8 Q 72 6 78 35 Q 68 18 50 18 Q 32 18 24 35 Z" fill="#f8fafc"/>',
      '<rect x="30" y="42" width="40" height="10" rx="3" fill="#09090b"/><circle cx="42" cy="47" r="1.5" fill="#38bdf8" filter="url(#glow)"/><circle cx="58" cy="47" r="1.5" fill="#38bdf8" filter="url(#glow)"/>')
  },
  // 3. Monkey D. Luffy (One Piece)
  {
    name: 'Monkey D. Luffy',
    series: 'One Piece',
    url: makeAvatarSvg('#7c2d12,#ea580c', '#dc2626', '#ffffff',
      '<path d="M 28 36 Q 50 18 72 36 Z" fill="#18181b"/>',
      '<ellipse cx="50" cy="22" rx="36" ry="10" fill="#eab308"/><ellipse cx="50" cy="20" rx="20" ry="8" fill="#ca8a04"/><path d="M 30 22 Q 50 24 70 22" stroke="#dc2626" stroke-width="3" fill="none"/>')
  },
  // 4. Ichigo Kurosaki (Bleach)
  {
    name: 'Ichigo Kurosaki',
    series: 'Bleach',
    url: makeAvatarSvg('#451a03,#c2410c', '#ea580c', '#f59e0b',
      '<path d="M 22 35 Q 30 8 50 6 Q 70 8 78 35 Q 64 16 50 18 Q 36 16 22 35 Z" fill="#f97316"/>',
      '<path d="M 34 32 L 38 42 M 66 32 L 62 42" stroke="#ea580c" stroke-width="2"/>')
  },
  // 5. Frieren (Frieren: Beyond Journey)
  {
    name: 'Frieren',
    series: 'Frieren',
    url: makeAvatarSvg('#042f2e,#0d9488', '#2dd4bf', '#10b981',
      '<path d="M 26 36 Q 50 14 74 36 Q 85 62 82 85 Q 74 52 70 42 Q 30 42 26 85 Z" fill="#e2e8f0"/>',
      '<polygon points="48,58 50,56 52,58 50,60" fill="#ec4899"/>')
  },
  // 6. Kim Dokja (Omniscient Reader)
  {
    name: 'Kim Dokja',
    series: 'ORV',
    url: makeAvatarSvg('#0f172a,#1e293b', '#64748b', '#38bdf8',
      '<path d="M 26 36 Q 48 16 74 36 Q 66 22 50 22 Q 34 22 26 36 Z" fill="#020617"/>',
      '<circle cx="50" cy="16" r="3" fill="#38bdf8" filter="url(#glow)"/>')
  },
  // 7. Lloyd Frontera (Greatest Estate Dev)
  {
    name: 'Lloyd Frontera',
    series: 'Estate Dev',
    url: makeAvatarSvg('#3f2c06,#a16207', '#ca8a04', '#eab308',
      '<path d="M 26 36 Q 50 16 74 36 Q 66 22 50 22 Z" fill="#292524"/>',
      '<path d="M 40 58 Q 50 68 62 58" stroke="#713f12" stroke-width="2.5" fill="#fef08a"/>')
  },
  // 8. Arthur Leywin (TBATE)
  {
    name: 'Arthur Leywin',
    series: 'TBATE',
    url: makeAvatarSvg('#2e1065,#581c87', '#a855f7', '#c084fc',
      '<path d="M 24 36 Q 50 12 76 36 Q 66 18 50 18 Q 34 18 24 36 Z" fill="#fde047"/>',
      '<path d="M 44 46 A 2 2 0 0 1 44 47 M 60 46 A 2 2 0 0 1 60 47" stroke="#9333ea" stroke-width="1.5"/>')
  },
  // 9. Klein Moretti (Lord of Mysteries)
  {
    name: 'Klein Moretti',
    series: 'LOTM',
    url: makeAvatarSvg('#1c1917,#292524', '#78716c', '#f59e0b',
      '<path d="M 26 38 Q 50 20 74 38 Z" fill="#1c1917"/>',
      '<rect x="36" y="8" width="28" height="24" rx="2" fill="#09090b"/><ellipse cx="50" cy="32" rx="26" ry="6" fill="#18181b"/><rect x="36" y="27" width="28" height="4" fill="#b91c1c"/>')
  },
  // 10. Sunny (Shadow Slave)
  {
    name: 'Sunny',
    series: 'Shadow Slave',
    url: makeAvatarSvg('#020617,#0f172a', '#334155', '#94a3b8',
      '<path d="M 24 34 Q 46 8 74 34 Q 62 20 48 20 Q 32 20 24 34 Z" fill="#020617"/>',
      '<circle cx="50" cy="50" r="1.5" fill="#38bdf8" opacity="0.6"/>')
  },
  // 11. Ainz Ooal Gown (Overlord)
  {
    name: 'Ainz Ooal Gown',
    series: 'Overlord',
    url: makeAvatarSvg('#3b0764,#6b21a8', '#9333ea', '#dc2626',
      '<rect x="34" y="32" width="32" height="36" rx="10" fill="#f8fafc"/>',
      '<circle cx="43" cy="46" r="3" fill="#dc2626" filter="url(#glow)"/><circle cx="57" cy="46" r="3" fill="#dc2626" filter="url(#glow)"/><polygon points="34,26 42,12 50,22 58,12 66,26" fill="#eab308"/>')
  },
  // 12. Cale Henituse (Trash of Counts)
  {
    name: 'Cale Henituse',
    series: 'Trash of Counts',
    url: makeAvatarSvg('#450a0a,#7f1d1d', '#991b1b', '#ef4444',
      '<path d="M 24 36 Q 50 14 76 36 Q 64 18 50 18 Q 36 18 24 36 Z" fill="#dc2626"/>',
      '<circle cx="68" cy="72" r="3" fill="#ca8a04"/>')
  },
  // 13. Zorian Kazinski (Mother of Learning)
  {
    name: 'Zorian Kazinski',
    series: 'Mother of Learning',
    url: makeAvatarSvg('#082f49,#0369a1', '#0284c7', '#38bdf8',
      '<path d="M 26 36 Q 50 18 74 36 Z" fill="#1e293b"/>',
      '<circle cx="50" cy="30" r="4" fill="none" stroke="#38bdf8" stroke-width="1.5"/>')
  },
  // 14. Chung Myung (Return of Mount Hua)
  {
    name: 'Chung Myung',
    series: 'Mount Hua',
    url: makeAvatarSvg('#500724,#9d174d', '#db2777', '#f472b6',
      '<path d="M 26 36 Q 50 14 74 36 Z" fill="#1c1917"/>',
      '<circle cx="50" cy="24" r="3" fill="#f43f5e"/><ellipse cx="50" cy="20" rx="1.5" ry="3" fill="#fbcfe8"/><ellipse cx="50" cy="28" rx="1.5" ry="3" fill="#fbcfe8"/>')
  },
  // 15. Daniel Park (Lookism)
  {
    name: 'Daniel Park',
    series: 'Lookism',
    url: makeAvatarSvg('#0f172a,#1e1b4b', '#4338ca', '#818cf8',
      '<path d="M 28 35 Q 50 18 72 35 Z" fill="#09090b"/>',
      '<path d="M 40 40 L 46 41 M 60 41 L 54 40" stroke="#18181b" stroke-width="2"/>')
  },
  // 16. Luo Zheng (Apostle of Gods)
  {
    name: 'Luo Zheng',
    series: 'Apostle of Gods',
    url: makeAvatarSvg('#451a03,#78350f', '#d97706', '#fbbf24',
      '<path d="M 24 36 Q 50 10 76 36 Z" fill="#292524"/>',
      '<polygon points="50,20 53,26 60,27 55,32 56,38 50,35 44,38 45,32 40,27 47,26" fill="#fbbf24"/>')
  },
  // 17. Nie Li (Tales of Demons)
  {
    name: 'Nie Li',
    series: 'Tales of Demons',
    url: makeAvatarSvg('#14532d,#15803d', '#22c55e', '#86efac',
      '<path d="M 24 36 Q 50 12 76 36 Z" fill="#ca8a04"/>',
      '<path d="M 32 46 L 36 48 M 68 46 L 64 48" stroke="#15803d" stroke-width="2"/>')
  },
  // 18. Fang Yuan (Reverend Insanity)
  {
    name: 'Fang Yuan',
    series: 'Reverend Insanity',
    url: makeAvatarSvg('#022c22,#065f46', '#059669', '#34d399',
      '<path d="M 26 36 Q 50 16 74 36 Z" fill="#0f172a"/>',
      '<circle cx="50" cy="22" r="3.5" fill="#10b981" filter="url(#glow)"/>')
  },
  // 19. Xiao Yan (Battle Through Heavens)
  {
    name: 'Xiao Yan',
    series: 'Battle Through',
    url: makeAvatarSvg('#431407,#9a3412', '#c2410c', '#fb923c',
      '<path d="M 26 36 Q 50 14 74 36 Z" fill="#1c1917"/>',
      '<path d="M 50 14 Q 54 22 50 28 Q 46 22 50 14 Z" fill="#38bdf8" filter="url(#glow)"/>')
  },
  // 20. Tang San (Soul Land)
  {
    name: 'Tang San',
    series: 'Soul Land',
    url: makeAvatarSvg('#172554,#1e40af', '#2563eb', '#60a5fa',
      '<path d="M 24 36 Q 50 10 76 36 Z" fill="#1d4ed8"/>',
      '<circle cx="50" cy="24" r="2.5" fill="#93c5fd" filter="url(#glow)"/>')
  },
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
        {/* 20 Unblockable Illustrated Character Avatars */}
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
                className={`aspect-square rounded-2xl overflow-hidden border-2 transition relative p-0.5 bg-[#090d16] ${
                  selectedAvatar === av.url
                    ? 'border-indigo-500 scale-105 shadow-lg shadow-indigo-500/40 ring-2 ring-indigo-500/50'
                    : 'border-white/10 opacity-70 hover:opacity-100 hover:border-white/30'
                }`}
                title={`${av.name} (${av.series})`}
              >
                <img
                  src={av.url}
                  alt={av.name}
                  className="w-full h-full object-contain rounded-xl"
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
