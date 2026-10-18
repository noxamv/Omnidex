'use client';

import { useState, useEffect, useRef } from 'react';
import './globals.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { 
  Menu, Search, Bell, User, X, LogIn, LogOut, Mail, 
  CheckCircle2, Download, Star, BookOpen 
} from 'lucide-react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  // Scroll Header Auto-Hide States
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Modals & Panels
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Live Autocomplete Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // User & Follow Tracking
  const [user, setUser] = useState<any>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [email, setEmail] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPwaBanner, setShowPwaBanner] = useState(false);

  // Scroll auto-hide handler
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 60 && currentScrollY > lastScrollY) {
        setShowHeader(false);
        setMenuOpen(false);
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      const activeUser = session?.user ?? null;
      setUser(activeUser);
      if (activeUser) checkNotifications(activeUser.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const activeUser = session?.user ?? null;
      setUser(activeUser);
      if (activeUser) checkNotifications(activeUser.id);
      else setUnreadNotifications(0);
    });

    // PWA Prompt Listener
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
      const { data, count } = await supabase
        .from('user_tracker')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_following', true);

      if (count && count > 0) setUnreadNotifications(1);
    } catch (err) {}
  };

  // Debounced 2+ Character Autocomplete
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
        
        {/* Dynamic Auto-Hiding Fixed Header */}
        <header
          className={`fixed top-0 left-0 right-0 z-50 h-14 bg-[#0a0d14]/95 backdrop-blur-md border-b border-slate-800/80 px-4 transition-transform duration-300 ${
            showHeader ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          <div className="max-w-7xl h-full mx-auto flex items-center justify-between gap-3">
            
            {/* Left: MangaFire-Style Menu Toggle + Two-Tone Logo */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
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

              {/* Desktop Autocomplete Results */}
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

            {/* Right Top Controls */}
            <div className="flex items-center gap-1 sm:gap-2">
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
                <Link
                  href="/library"
                  aria-label="My Library"
                  className="p-1.5 rounded-full bg-gradient-to-tr from-indigo-600 to-pink-600 text-white font-bold text-xs ring-2 ring-indigo-500/50 flex items-center justify-center"
                >
                  <User className="w-4 h-4" />
                </Link>
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

          {/* Mobile Instant Live Search Dropdown */}
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

        {/* MangaFire-Style Compact Floating Menu Dropdown */}
        {menuOpen && (
          <div className="fixed inset-0 z-50">
            <div className="fixed inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
            <div className="absolute top-14 left-4 w-60 bg-[#0e121b] border border-slate-800 rounded-2xl shadow-2xl p-3 z-10 space-y-1">
              <div className="px-2 py-1 text-[11px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-800/80 mb-1">
                Menu
              </div>
              {[
                { label: 'Home Discovery', href: '/' },
                { label: 'Trending Novels', href: '/?type=novel' },
                { label: 'Trending Manhwa', href: '/?type=manhwa' },
                { label: 'Anime Releases', href: '/?type=anime' },
                { label: 'Popular Manga', href: '/?type=manga' },
                { label: 'My Library Tracker', href: '/library' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/70 transition"
                >
                  <span>{link.label}</span>
                </Link>
              ))}
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

        {/* Supabase Magic Link Modal */}
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
                    Check your inbox at <span className="text-indigo-400 font-semibold">{email}</span>. Click the link to log in directly.
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
