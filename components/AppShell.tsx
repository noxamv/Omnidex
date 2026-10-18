'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { 
  Menu, Search, Bell, X, LogIn, LogOut, Mail, 
  CheckCircle2, Download, ChevronDown, 
  Bookmark, SlidersHorizontal, Settings2, RefreshCw, 
  Upload, FileDown, Lock, Smartphone
} from 'lucide-react';

// Authentic Anime, Manga, Manhwa, and Novel Characters from Verified CDNs
export const AVATAR_CHARACTERS = [
  { id: 'sjw', name: 'Sung Jin-woo', series: 'Solo Leveling', url: 'https://cdn.myanimelist.net/images/characters/8/531267.jpg' },
  { id: 'gojo', name: 'Satoru Gojo', series: 'Jujutsu Kaisen', url: 'https://cdn.myanimelist.net/images/characters/5/292491.jpg' },
  { id: 'luffy', name: 'Monkey D. Luffy', series: 'One Piece', url: 'https://cdn.myanimelist.net/images/characters/5/72194.jpg' },
  { id: 'zoro', name: 'Roronoa Zoro', series: 'One Piece', url: 'https://cdn.myanimelist.net/images/characters/3/100534.jpg' },
  { id: 'frieren', name: 'Frieren', series: 'Beyond Journey\'s End', url: 'https://cdn.myanimelist.net/images/characters/11/496739.jpg' },
  { id: 'denji', name: 'Denji', series: 'Chainsaw Man', url: 'https://cdn.myanimelist.net/images/characters/4/488583.jpg' },
  { id: 'ichigo', name: 'Ichigo Kurosaki', series: 'Bleach', url: 'https://cdn.myanimelist.net/images/characters/3/264639.jpg' },
  { id: 'levi', name: 'Levi Ackerman', series: 'Attack on Titan', url: 'https://cdn.myanimelist.net/images/characters/2/241413.jpg' },
  { id: 'tanjiro', name: 'Tanjiro Kamado', series: 'Demon Slayer', url: 'https://cdn.myanimelist.net/images/characters/11/384790.jpg' },
  { id: 'rimuru', name: 'Rimuru Tempest', series: 'Slime Isekai', url: 'https://cdn.myanimelist.net/images/characters/4/365518.jpg' },
  { id: 'shadow', name: 'Cid Kagenou', series: 'Eminence in Shadow', url: 'https://cdn.myanimelist.net/images/characters/12/488737.jpg' },
  { id: 'klein', name: 'Klein Moretti', series: 'Lord of the Mysteries', url: 'https://cdn.myanimelist.net/images/characters/10/403593.jpg' },
  { id: 'lloyd', name: 'Lloyd Frontera', series: 'Estate Developer', url: 'https://cdn.myanimelist.net/images/characters/13/121373.jpg' },
  { id: 'arthur', name: 'Arthur Leywin', series: 'The Beginning After The End', url: 'https://cdn.myanimelist.net/images/characters/7/441492.jpg' },
  { id: 'subaru', name: 'Natsuki Subaru', series: 'Re:Zero', url: 'https://cdn.myanimelist.net/images/characters/11/310325.jpg' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const [menuOpen, setMenuOpen] = useState(false);
  const [trendingAccordion, setTrendingAccordion] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // User Auth & Credentials
  const [user, setUser] = useState<any>(null);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_CHARACTERS[0].url);
  const [displayName, setDisplayName] = useState('');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordLogin, setIsPasswordLogin] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Live Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // PWA State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPwaBanner, setShowPwaBanner] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  // User Settings State
  const [stepPref, setStepPref] = useState('1');

  useEffect(() => {
    // 1. Service Worker & PWA Check
    if (typeof window !== 'undefined') {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsAppInstalled(true);
      }

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      }

      const handleBeforeInstall = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowPwaBanner(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    }
  }, []);

  useEffect(() => {
    const savedStep = localStorage.getItem('omnidex_step_increment');
    if (savedStep) setStepPref(savedStep);

    const savedAvatar = localStorage.getItem('omnidex_user_avatar');
    if (savedAvatar) setSelectedAvatar(savedAvatar);

    // Initial session load
    supabase.auth.getSession().then(({ data: { session } }) => {
      const activeUser = session?.user ?? null;
      setUser(activeUser);
      if (activeUser) {
        setDisplayName(activeUser.email?.split('@')[0] || 'Tracker Member');
        checkNotifications(activeUser.id);
      }
    });

    // Session State Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const activeUser = session?.user ?? null;
      setUser(activeUser);
      if (activeUser) {
        setDisplayName(activeUser.email?.split('@')[0] || 'Tracker Member');
        checkNotifications(activeUser.id);
      } else {
        setUnreadNotifications(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Header auto-hide
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 60 && currentScrollY > lastScrollY) {
        setShowHeader(false);
        setMenuOpen(false);
        setUserMenuOpen(false);
      } else {
        setShowHeader(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const checkNotifications = async (userId: string) => {
    try {
      const { count } = await supabase
        .from('user_tracker')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_following', true);

      if (count && count > 0) setUnreadNotifications(1);
    } catch (err) {}
  };

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    const delay = setTimeout(async () => {
      const { data } = await supabase
        .from('media_catalog')
        .select('id, title_primary, cover_url, media_type, format, score')
        .ilike('title_primary', `%${searchQuery.trim()}%`)
        .limit(6);

      setSearchResults(data || []);
      setSearchLoading(false);
    }, 200);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  // Auth Handler: Supports Magic Link OR Password Sign In (Bypasses rate limit)
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setAuthLoading(true);
    setAuthError('');

    if (isPasswordLogin) {
      // 1. Password login / signup
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        // Try sign up if user does not exist yet
        const { error: signUpErr } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
        });
        if (signUpErr) {
          setAuthError(signUpErr.message);
        } else {
          setAuthOpen(false);
        }
      } else {
        setAuthOpen(false);
      }
    } else {
      // 2. Magic Link with catch for rate limit
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });

      if (error) {
        if (error.message.includes('rate_limit') || error.message.includes('security')) {
          setAuthError('Email rate limit reached. Switch to "Sign In with Password" below to log in instantly.');
          setIsPasswordLogin(true);
        } else {
          setAuthError(error.message);
        }
      } else {
        setMagicLinkSent(true);
      }
    }

    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('omnidex_user_avatar');
    setUser(null);
    setUserMenuOpen(false);
  };

  const handleSelectAvatar = (url: string) => {
    setSelectedAvatar(url);
    localStorage.setItem('omnidex_user_avatar', url);
  };

  const triggerPwaInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPwaBanner(false);
        setIsAppInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert('To install: Tap your mobile browser menu (⋮ or Share) and select "Add to Home Screen" or "Install App".');
    }
  };

  const handleExportBackup = async () => {
    let exportData = [];
    if (user) {
      const { data } = await supabase
        .from('user_tracker')
        .select('*, media_catalog(title_primary, media_type)')
        .eq('user_id', user.id);
      exportData = data || [];
    } else {
      exportData = JSON.parse(localStorage.getItem('omnidex_guest_library') || '[]');
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnidex-library-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveSettings = () => {
    localStorage.setItem('omnidex_step_increment', stepPref);
    setSettingsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col">
      {/* Top Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 h-14 bg-[#0a0d14]/95 backdrop-blur-md border-b border-slate-800/80 px-4 transition-transform duration-300 ${
          showHeader ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-7xl h-full mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => { setMenuOpen(!menuOpen); setUserMenuOpen(false); }}
              aria-label="Toggle menu"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link href="/" className="flex items-center select-none">
              <span className="text-xl font-black tracking-tight text-indigo-500">Omni</span>
              <span className="text-xl font-black tracking-tight text-white">dex</span>
            </Link>
          </div>

          <div className="hidden md:block flex-1 max-w-sm mx-4 relative">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anime, manga, manhwa, novels..."
                className="w-full bg-[#111622] border border-slate-800/90 rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {searchQuery.length >= 2 && (
              <div className="absolute top-10 left-0 right-0 bg-[#0e121b] border border-slate-800 rounded-xl shadow-2xl p-2 z-50 space-y-1">
                {searchLoading && <p className="text-[11px] text-slate-500 p-2">Searching titles...</p>}
                {!searchLoading && searchResults.length === 0 && (
                  <p className="text-[11px] text-slate-500 p-2">No matching titles.</p>
                )}
                {searchResults.map((item) => (
                  <Link
                    key={item.id}
                    href={`/series/${item.id}`}
                    onClick={() => setSearchQuery('')}
                    className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-800/60 transition group"
                  >
                    <img src={item.cover_url} alt="" className="w-8 aspect-[2/3] object-cover rounded bg-slate-900" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 truncate">
                        {item.title_primary}
                      </p>
                      <span className="text-[9px] uppercase font-semibold text-slate-500">{item.media_type}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search"
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setNotifOpen(!notifOpen)}
              aria-label="Notifications"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition relative"
            >
              <Bell className="w-5 h-5" />
              {user && unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-[#0a0d14]" />
              )}
            </button>

            {user ? (
              <button
                type="button"
                onClick={() => { setUserMenuOpen(!userMenuOpen); setMenuOpen(false); }}
                aria-label="User Account"
                className="w-8 h-8 rounded-full overflow-hidden border border-indigo-500/60 shadow-sm transition active:scale-95"
              >
                <img src={selectedAvatar} alt="" className="w-full h-full object-cover" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-bold border border-indigo-500/30 transition flex items-center gap-1"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {searchOpen && (
          <div className="md:hidden absolute top-14 left-0 right-0 bg-[#0a0d14] border-b border-slate-800 p-3 shadow-2xl">
            <div className="relative flex items-center">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type 2+ letters to search..."
                className="w-full bg-[#111622] border border-slate-700 rounded-xl pl-9 pr-9 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3" />
              <button
                type="button"
                onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                className="absolute right-2.5 p-1 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {searchQuery.length >= 2 && (
              <div className="mt-2 space-y-1 max-h-64 overflow-y-auto">
                {searchLoading && <p className="text-[11px] text-slate-500 py-2">Searching...</p>}
                {!searchLoading && searchResults.length === 0 && (
                  <p className="text-[11px] text-slate-500 py-2">No results found.</p>
                )}
                {searchResults.map((item) => (
                  <Link
                    key={item.id}
                    href={`/series/${item.id}`}
                    onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                    className="flex items-center gap-2.5 p-2 rounded-lg bg-[#111622] hover:bg-slate-800 transition"
                  >
                    <img src={item.cover_url} alt="" className="w-8 aspect-[2/3] object-cover rounded bg-slate-900" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate">{item.title_primary}</p>
                      <span className="text-[9px] uppercase font-semibold text-slate-400">{item.media_type}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Left Menu Dropdown */}
      {menuOpen && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute top-14 left-4 w-52 bg-[#0e121b] border border-slate-800 rounded-2xl shadow-2xl p-2.5 z-10 space-y-1">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800/80 transition"
            >
              <span>Home</span>
            </Link>

            <div>
              <button
                type="button"
                onClick={() => setTrendingAccordion(!trendingAccordion)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800/80 transition"
              >
                <span>Trending Series</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${trendingAccordion ? 'rotate-180' : ''}`} />
              </button>

              {trendingAccordion && (
                <div className="pl-3 pr-1 py-1 space-y-0.5 border-l-2 border-indigo-500/40 ml-3 mt-1">
                  {[
                    { label: 'Anime', href: '/?type=anime' },
                    { label: 'Manga', href: '/?type=manga' },
                    { label: 'Manhwa', href: '/?type=manhwa' },
                    { label: 'Manhua', href: '/?type=manhua' },
                    { label: 'Novels', href: '/?type=novel' },
                  ].map((sub) => (
                    <Link
                      key={sub.label}
                      href={sub.href}
                      onClick={() => setMenuOpen(false)}
                      className="block px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 hover:text-indigo-400 transition"
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/filter"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800/80 transition"
            >
              <span>Filter</span>
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            </Link>

            {/* Direct PWA Install trigger in menu */}
            {!isAppInstalled && (
              <button
                type="button"
                onClick={() => { setMenuOpen(false); triggerPwaInstall(); }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-indigo-400 hover:bg-indigo-600/20 transition"
              >
                <span>Install Omnidex App</span>
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Right User Avatar Dropdown */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/40" onClick={() => setUserMenuOpen(false)} />
          <div className="absolute top-14 right-4 w-56 bg-[#0e121b] border border-slate-800 rounded-2xl shadow-2xl p-2.5 z-10 space-y-1">
            <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
              <p className="text-xs font-black text-white truncate">{displayName}</p>
              <p className="text-[10px] text-indigo-400 font-semibold truncate">{user?.email}</p>
            </div>

            <button
              type="button"
              onClick={() => { setProfileModalOpen(true); setUserMenuOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800/80 transition"
            >
              <span>Edit Profile (Avatars)</span>
            </button>

            <Link
              href="/library"
              onClick={() => setUserMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800/80 transition"
            >
              <span>Library</span>
              <Bookmark className="w-3.5 h-3.5 text-slate-500" />
            </Link>

            <button
              type="button"
              onClick={() => { setSyncModalOpen(true); setUserMenuOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800/80 transition"
            >
              <span>Import & Sync</span>
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            </button>

            <button
              type="button"
              onClick={() => { setSettingsModalOpen(true); setUserMenuOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800/80 transition"
            >
              <span>Settings</span>
              <Settings2 className="w-3.5 h-3.5 text-slate-500" />
            </button>

            <div className="pt-1 border-t border-slate-800/80">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-white hover:bg-rose-600/20 transition"
              >
                <span>Log Out</span>
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal: Authentic 15 Character Avatars */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setProfileModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-[#0e121b] border border-slate-800 rounded-2xl p-5 shadow-2xl z-10 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="font-bold text-sm text-white">Choose Anime Character Avatar</h3>
              <button onClick={() => setProfileModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-2">
              {AVATAR_CHARACTERS.map((char) => (
                <button
                  key={char.id}
                  onClick={() => handleSelectAvatar(char.url)}
                  className={`flex flex-col items-center group relative rounded-xl p-1.5 transition ${
                    selectedAvatar === char.url ? 'ring-2 ring-indigo-500 bg-indigo-500/20' : 'hover:bg-slate-800'
                  }`}
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-900 border border-slate-700 shadow-md">
                    <img 
                      src={char.url} 
                      alt={char.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                      loading="lazy"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-200 mt-1 line-clamp-1 text-center">
                    {char.name}
                  </span>
                  <span className="text-[8px] text-slate-500 line-clamp-1 text-center">
                    {char.series}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setProfileModalOpen(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition"
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {notifOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setNotifOpen(false)} />
          <div className="relative w-full max-w-sm bg-[#0e121b] border border-slate-800 rounded-2xl p-5 shadow-2xl z-10 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-indigo-400" /> Notifications
              </h3>
              <button onClick={() => setNotifOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {user 
                ? "You're all caught up! New releases for your followed series will notify you here."
                : "Sign in to follow series and receive chapter alerts."}
            </p>
          </div>
        </div>
      )}

      {/* Import & Sync Modal */}
      {syncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSyncModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-[#0e121b] border border-slate-800 rounded-2xl p-5 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-indigo-400" /> Import & Sync
              </h3>
              <button onClick={() => setSyncModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <button 
                onClick={() => alert('Connect your public AniList username to auto-sync tracked titles.')}
                className="w-full p-3 rounded-xl bg-[#111622] hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-slate-300 font-bold transition"
              >
                <span>Import from AniList</span>
                <Upload className="w-4 h-4 text-indigo-400" />
              </button>

              <button 
                onClick={() => alert('MangaDex MDList import: Paste your reading list public URL.')}
                className="w-full p-3 rounded-xl bg-[#111622] hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-slate-300 font-bold transition"
              >
                <span>Import from MangaDex</span>
                <Upload className="w-4 h-4 text-indigo-400" />
              </button>

              <button 
                onClick={handleExportBackup}
                className="w-full p-3 rounded-xl bg-[#111622] hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-slate-300 font-bold transition"
              >
                <span>Export Omnidex Backup (JSON)</span>
                <FileDown className="w-4 h-4 text-indigo-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tracker Settings Modal */}
      {settingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSettingsModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-[#0e121b] border border-slate-800 rounded-2xl p-5 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <Settings2 className="w-4 h-4 text-indigo-400" /> Tracker Settings
              </h3>
              <button onClick={() => setSettingsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Priority Language Source:</label>
                <select className="w-full bg-[#111622] border border-slate-700 rounded-lg p-2 text-slate-200">
                  <option>English Subtitles / Translations</option>
                  <option>Original Official Raws (KR / JP / CN)</option>
                  <option>Multi-Language Global Dubs</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Quick Progress Increment:</label>
                <select 
                  value={stepPref} 
                  onChange={(e) => setStepPref(e.target.value)}
                  className="w-full bg-[#111622] border border-slate-700 rounded-lg p-2 text-slate-200"
                >
                  <option value="1">+1 Step per tap</option>
                  <option value="5">+5 Steps (Bulk Read)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveSettings}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 font-bold text-white rounded-xl transition"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dual Auth Modal: Prevents Rate Limits */}
      {authOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAuthOpen(false)} />
          <div className="relative w-full max-w-sm bg-[#0e121b] border border-slate-800 rounded-2xl p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-sm text-white">
                {isPasswordLogin ? 'Sign In / Register with Password' : 'Sign In with Magic Link'}
              </h3>
              <button onClick={() => setAuthOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {authError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-relaxed">
                {authError}
              </div>
            )}

            {magicLinkSent ? (
              <div className="text-center py-4 space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-sm text-white">Magic Link Sent!</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Click the login link dispatched to <span className="text-indigo-400 font-semibold">{email}</span>.
                </p>
                <button
                  onClick={() => { setMagicLinkSent(false); setAuthOpen(false); }}
                  className="px-4 py-2 bg-slate-800 rounded-xl text-xs font-bold text-slate-300"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleAuthSubmit} className="space-y-3 pt-1">
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#111622] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                {isPasswordLogin && (
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="Enter account password..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#111622] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition disabled:opacity-50"
                >
                  {authLoading ? 'Signing in...' : (isPasswordLogin ? 'Sign In / Register' : 'Send Magic Link')}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => { setIsPasswordLogin(!isPasswordLogin); setAuthError(''); }}
                    className="text-[11px] text-indigo-400 hover:underline font-semibold"
                  >
                    {isPasswordLogin ? '← Switch to Email Magic Link' : 'Bypass Email Limit: Sign In with Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Floating Bottom PWA Install Banner */}
      {showPwaBanner && !isAppInstalled && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto bg-[#0e121b]/95 backdrop-blur-md border border-slate-800 p-3.5 rounded-2xl shadow-2xl z-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Install Omnidex App</p>
              <p className="text-[10px] text-slate-400">Add to home screen for offline tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={triggerPwaInstall}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
            >
              Install
            </button>
            <button
              onClick={() => setShowPwaBanner(false)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <main className="pt-14 pb-16 flex-1">{children}</main>
    </div>
  );
}
