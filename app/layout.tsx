'use client';

import { useState, useEffect } from 'react';
import './globals.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { 
  Menu, Search, Bell, X, LogIn, LogOut, Mail, 
  CheckCircle2, Download, ChevronDown, 
  Bookmark, SlidersHorizontal, Settings2, RefreshCw, 
  Upload, FileDown
} from 'lucide-react';

export const AVATAR_CHARACTERS = [
  // Manhwa & Webtoons
  { id: 'sjw', name: 'Sung Jin-woo', url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&q=80' },
  { id: 'kdj', name: 'Kim Dokja', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=150&q=80' },
  { id: 'yjh', name: 'Yoo Joonghyuk', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=150&q=80' },
  { id: 'lloyd', name: 'Lloyd Frontera', url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=150&q=80' },
  { id: 'arthur', name: 'Arthur Leywin', url: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?w=150&q=80' },
  { id: 'cadan', name: 'Cadis Etrama', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=150&q=80' },
  { id: 'bam', name: 'Twenty-Fifth Bam', url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150&q=80' },
  { id: 'cheong', name: 'Chung Myung', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=150&q=80' },
  { id: 'kayden', name: 'Kayden Break', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&q=80' },

  // Novels
  { id: 'klein', name: 'Klein Moretti', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=150&q=80' },
  { id: 'sunny', name: 'Sunny', url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=150&q=80' },
  { id: 'zorian', name: 'Zorian Kazinski', url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=150&q=80' },
  { id: 'zac', name: 'Zac Atwood', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=150&q=80' },
  { id: 'rimuru', name: 'Rimuru Tempest', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=150&q=80' },
  { id: 'subaru', name: 'Natsuki Subaru', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=150&q=80' },
  { id: 'shadow', name: 'Cid Kagenou', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&q=80' },
  { id: 'rudeus', name: 'Rudeus Greyrat', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=150&q=80' },

  // Anime & Manga
  { id: 'frieren', name: 'Frieren', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=150&q=80' },
  { id: 'gojo', name: 'Satoru Gojo', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=150&q=80' },
  { id: 'luffy', name: 'Monkey D. Luffy', url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&q=80' },
  { id: 'zoro', name: 'Roronoa Zoro', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=150&q=80' },
  { id: 'ichigo', name: 'Ichigo Kurosaki', url: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?w=150&q=80' },
  { id: 'levi', name: 'Levi Ackerman', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=150&q=80' },
  { id: 'denji', name: 'Denji', url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150&q=80' },
  { id: 'tanjiro', name: 'Tanjiro Kamado', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=150&q=80' },
  { id: 'edward', name: 'Edward Elric', url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=150&q=80' },

  // Manhua & Cultivation
  { id: 'tangsan', name: 'Tang San', url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=150&q=80' },
  { id: 'luozheng', name: 'Luo Zheng', url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=150&q=80' },
  { id: 'xiaoyan', name: 'Xiao Yan', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=150&q=80' },
  { id: 'nie_li', name: 'Nie Li', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&q=80' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  const [user, setUser] = useState<any>(null);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_CHARACTERS[0].url);
  const [displayName, setDisplayName] = useState('');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [email, setEmail] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPwaBanner, setShowPwaBanner] = useState(false);

  // Register Service Worker for PWA installation
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => console.log('[PWA] Service Worker active:', reg.scope))
          .catch((err) => console.warn('[PWA] Service Worker registration failed:', err));
      });
    }
  }, []);

  // Header auto-hide logic on scroll
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

  // Auth & Notifications check
  useEffect(() => {
    const savedAvatar = localStorage.getItem('omnidex_user_avatar');
    if (savedAvatar) setSelectedAvatar(savedAvatar);

    supabase.auth.getSession().then(({ data: { session } }) => {
      const activeUser = session?.user ?? null;
      setUser(activeUser);
      if (activeUser) {
        setDisplayName(activeUser.email?.split('@')[0] || 'Member');
        checkNotifications(activeUser.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const activeUser = session?.user ?? null;
      setUser(activeUser);
      if (activeUser) {
        setDisplayName(activeUser.email?.split('@')[0] || 'Member');
        checkNotifications(activeUser.id);
      } else {
        setUnreadNotifications(0);
      }
    });

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPwaBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

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

  // Debounced live search autocomplete
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    const delayDebounce = setTimeout(async () => {
      const { data } = await supabase
        .from('media_catalog')
        .select('id, title_primary, cover_url, media_type, format, score')
        .ilike('title_primary', `%${searchQuery.trim()}%`)
        .limit(6);

      setSearchResults(data || []);
      setSearchLoading(false);
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });

    setAuthLoading(false);
    if (!error) {
      setMagicLinkSent(true);
    } else {
      alert(error.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserMenuOpen(false);
  };

  const handleSelectAvatar = (url: string) => {
    setSelectedAvatar(url);
    localStorage.setItem('omnidex_user_avatar', url);
  };

  const handlePwaInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPwaBanner(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <html lang="en">
      <head>
        <title>Omnidex — Official Media Tracker</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#07090e" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen bg-[#07090e] text-slate-100 selection:bg-indigo-600 antialiased font-sans">
        
        {/* Navigation Bar */}
        <header
          className={`fixed top-0 left-0 right-0 z-50 h-14 bg-[#0a0d14]/95 backdrop-blur-md border-b border-slate-800/80 px-4 transition-transform duration-300 ${
            showHeader ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          <div className="max-w-7xl h-full mx-auto flex items-center justify-between gap-3">
            
            {/* Left Hamburger + Brand */}
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

            {/* Desktop Center Instant Search */}
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

            {/* Right Header Icons */}
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

          {/* Mobile Search Overlay */}
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

        {/* Left Menu: Compact w-52 Dropdown (< 50% screen) */}
        {menuOpen && (
          <div className="fixed inset-0 z-50">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-none" onClick={() => setMenuOpen(false)} />
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
            </div>
          </div>
        )}

        {/* Right User Avatar Menu: Compact w-56 Dropdown */}
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
                <span>Edit Profile</span>
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
                  ? "You're all caught up! New chapter and episode releases for your followed series will notify you here."
                  : "Sign in to follow series and receive chapter alerts."}
              </p>
            </div>
          </div>
        )}

        {/* Profile & Avatar Picker Modal */}
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

              <div className="grid grid-cols-5 gap-3 pt-2">
                {AVATAR_CHARACTERS.map((char) => (
                  <button
                    key={char.id}
                    onClick={() => handleSelectAvatar(char.url)}
                    className={`flex flex-col items-center group relative rounded-xl overflow-hidden p-1 transition ${
                      selectedAvatar === char.url ? 'ring-2 ring-indigo-500 bg-indigo-500/20' : 'hover:bg-slate-800'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-900 border border-slate-700">
                      <img src={char.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                    </div>
                    <span className="text-[9px] font-bold text-slate-300 mt-1 line-clamp-1 text-center">
                      {char.name}
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
                <button className="w-full p-3 rounded-xl bg-[#111622] hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-slate-300 font-bold transition">
                  <span>Import from AniList</span>
                  <Upload className="w-4 h-4 text-indigo-400" />
                </button>

                <button className="w-full p-3 rounded-xl bg-[#111622] hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-slate-300 font-bold transition">
                  <span>Import from MangaDex</span>
                  <Upload className="w-4 h-4 text-indigo-400" />
                </button>

                <button className="w-full p-3 rounded-xl bg-[#111622] hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-slate-300 font-bold transition">
                  <span>Export Omnidex Backup (JSON)</span>
                  <FileDown className="w-4 h-4 text-indigo-400" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
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
                  <select className="w-full bg-[#111622] border border-slate-700 rounded-lg p-2 text-slate-200">
                    <option>+1 Step per tap</option>
                    <option>+5 Steps (Bulk Read)</option>
                    <option>Always Open Number Pad</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setSettingsModalOpen(false)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 font-bold text-white rounded-xl transition"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Supabase Magic Link Auth Modal */}
        {authOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAuthOpen(false)} />
            <div className="relative w-full max-w-sm bg-[#0e121b] border border-slate-800 rounded-2xl p-6 shadow-2xl z-10 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-black text-sm text-white">Sign In with Magic Link</h3>
                <button onClick={() => setAuthOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {magicLinkSent ? (
                <div className="text-center py-4 space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="font-bold text-sm text-white">Magic Link Dispatched</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Check your email inbox at <span className="text-indigo-400 font-semibold">{email}</span>. Click the link to log in directly.
                  </p>
                  <button
                    onClick={() => { setMagicLinkSent(false); setAuthOpen(false); }}
                    className="px-4 py-2 bg-slate-800 rounded-xl text-xs font-bold text-slate-300"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleMagicLink} className="space-y-3 pt-1">
                  <p className="text-xs text-slate-400">
                    Sign in to track progress across devices and bookmark series. No passwords required.
                  </p>
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
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition disabled:opacity-50"
                  >
                    {authLoading ? 'Sending...' : 'Send Magic Link'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* PWA Floating Bottom Pop-up Banner */}
        {showPwaBanner && (
          <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto bg-[#0e121b]/95 backdrop-blur-md border border-slate-800 p-3.5 rounded-2xl shadow-2xl z-50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Install Omnidex App</p>
                <p className="text-[10px] text-slate-400">Faster offline progress tracking</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePwaInstall}
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

        <main className="pt-14 pb-16">{children}</main>
      </body>
    </html>
  );
}
