// components/AppShell.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import OmnidexLogo from './OmnidexLogo';
import { 
  Menu, Search, X, LogOut, 
  Bookmark, SlidersHorizontal, RefreshCw, 
  FileDown, Smartphone, Star, 
  Bell, ChevronRight, User, Settings,
  Flame, Clock, Shuffle, Home, Check
} from 'lucide-react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [navMenuOpen, setNavMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifPopoverOpen, setNotifPopoverOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const [totalCatalogCount, setTotalCatalogCount] = useState<number | null>(null);

  // User & Avatar State
  const [user, setUser] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordLogin, setIsPasswordLogin] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Live ⌘K Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // PWA Prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  // Notifications State
  const [unreadNotifs, setUnreadNotifs] = useState<any[]>([
    { id: 1, title: 'Solo Leveling: Ragnarok', desc: 'Chapter 28 dropped today', time: '2h ago', unread: true },
    { id: 2, title: 'Lord of the Mysteries', desc: 'New volume batch updated', time: '1d ago', unread: true }
  ]);

  // Load avatar and live catalog count
  useEffect(() => {
    supabase
      .from('media_catalog')
      .select('*', { count: 'exact', head: true })
      .then(({ count }) => {
        if (count) setTotalCatalogCount(count);
      });

    // Load local avatar cache
    const savedAvatar = localStorage.getItem('omnidex_user_avatar');
    if (savedAvatar) setAvatarUrl(savedAvatar);
  }, []);

  // Listen for custom avatar update event from profile page
  useEffect(() => {
    const handleAvatarUpdate = (e: any) => {
      if (e.detail?.url) setAvatarUrl(e.detail.url);
    };
    window.addEventListener('omnidex_avatar_changed', handleAvatarUpdate);
    return () => window.removeEventListener('omnidex_avatar_changed', handleAvatarUpdate);
  }, []);

  // Keyboard shortcut ⌘K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
        setNavMenuOpen(false);
        setUserMenuOpen(false);
        setNotifPopoverOpen(false);
        setAuthOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // Auth State Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user?.id) fetchCloudProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.id) fetchCloudProfile(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchCloudProfile(userId: string) {
    try {
      const { data } = await supabase.from('profiles').select('avatar_url').eq('id', userId).single();
      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
        localStorage.setItem('omnidex_user_avatar', data.avatar_url);
      }
    } catch {}
  }

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      const { data } = await supabase
        .from('media_catalog')
        .select('id, title_primary, title_secondary, cover_url, media_type, status, score')
        .ilike('title_primary', `%${searchQuery.trim()}%`)
        .limit(8);
      setSearchResults(data || []);
      setSearchLoading(false);
    }, 180);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstallBtn(false);
    setDeferredPrompt(null);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      if (isPasswordLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setAuthOpen(false);
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setMagicLinkSent(true);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const markAllNotifsRead = () => {
    setUnreadNotifs((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#06080d] text-zinc-100">
      {/* Top Fixed Header */}
      <header className="sticky top-0 z-40 w-full bg-[#06080d]/85 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          
          {/* FAR LEFT: Menu Toggle + Omnidex Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setNavMenuOpen((prev) => !prev);
                setUserMenuOpen(false);
                setNotifPopoverOpen(false);
              }}
              className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white transition"
              title="Browse Catalog"
              aria-label="Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            <Link href="/" className="flex items-center gap-2.5 group">
              <OmnidexLogo className="w-7 h-7 sm:w-8 sm:h-8 group-hover:scale-105 transition-transform duration-300" />
              <span className="font-black text-lg sm:text-xl tracking-tight text-white group-hover:text-indigo-400 transition">
                Omnidex
              </span>
            </Link>
          </div>

          {/* FAR RIGHT: Search, Notifications & Avatar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-white/10 text-zinc-400 hover:text-zinc-200 transition text-xs font-medium"
            >
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-zinc-800 border border-white/10 text-[10px] font-mono text-zinc-400">
                ⌘K
              </kbd>
            </button>

            {/* Notification Bell with Badge */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotifPopoverOpen((prev) => !prev);
                  setNavMenuOpen(false);
                  setUserMenuOpen(false);
                }}
                className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white transition relative"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs.some((n) => n.unread) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-[#06080d]" />
                )}
              </button>
            </div>

            {/* User Avatar Badge with Live Custom Image */}
            {user ? (
              <button
                onClick={() => {
                  setUserMenuOpen((prev) => !prev);
                  setNavMenuOpen(false);
                  setNotifPopoverOpen(false);
                }}
                className="w-8 h-8 rounded-xl overflow-hidden border border-indigo-500/40 hover:border-indigo-400 transition flex items-center justify-center bg-zinc-900"
                title="Account Menu"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-black text-xs text-indigo-400">
                    {user.email?.[0].toUpperCase() || 'U'}
                  </span>
                )}
              </button>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition shadow-sm shadow-indigo-600/30"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* TOP-LEFT: Browse Catalog Floating Popover (w-[230px], tightly padded) */}
      {navMenuOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-transparent" onClick={() => setNavMenuOpen(false)} />
          <div className="absolute top-14 left-4 sm:left-6 w-[230px] rounded-2xl bg-[#0e121b]/95 backdrop-blur-xl border border-white/10 shadow-2xl p-2 z-10 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 px-2 pb-1.5 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Browse</span>
              <button onClick={() => setNavMenuOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <nav className="space-y-0.5 text-xs font-bold">
              <Link
                href="/"
                onClick={() => setNavMenuOpen(false)}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 text-zinc-200 hover:text-indigo-400 transition"
              >
                <div className="flex items-center gap-2">
                  <Home className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Home</span>
                </div>
              </Link>

              <Link
                href="/trending"
                onClick={() => setNavMenuOpen(false)}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 text-zinc-200 hover:text-rose-400 transition"
              >
                <div className="flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                  <span>Trending Series</span>
                </div>
              </Link>

              <Link
                href="/popular"
                onClick={() => setNavMenuOpen(false)}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 text-zinc-200 hover:text-amber-400 transition"
              >
                <div className="flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                  <span>Popular Series</span>
                </div>
              </Link>

              {/* Clean 'Filter' label removing unnecessary text */}
              <Link
                href="/filter"
                onClick={() => setNavMenuOpen(false)}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 text-zinc-200 hover:text-indigo-400 transition"
              >
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Filter</span>
                </div>
              </Link>

              <Link
                href="/latest"
                onClick={() => setNavMenuOpen(false)}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 text-zinc-200 hover:text-cyan-400 transition"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Latest Releases</span>
                </div>
              </Link>

              <Link
                href="/random"
                onClick={() => setNavMenuOpen(false)}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 text-zinc-200 hover:text-purple-400 transition"
              >
                <div className="flex items-center gap-2">
                  <Shuffle className="w-3.5 h-3.5 text-purple-400" />
                  <span>Random Series</span>
                </div>
              </Link>

              {showInstallBtn && (
                <button
                  onClick={() => {
                    handleInstallPWA();
                    setNavMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 transition text-left mt-1"
                >
                  <span className="flex items-center gap-2 text-[11px]">
                    <Smartphone className="w-3.5 h-3.5" /> Install App
                  </span>
                </button>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* TOP-RIGHT: User Account Popover (w-[230px], no dead right padding) */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-transparent" onClick={() => setUserMenuOpen(false)} />
          <div className="absolute top-14 right-4 sm:right-6 w-[230px] rounded-2xl bg-[#0e121b]/95 backdrop-blur-xl border border-white/10 shadow-2xl p-2 z-10 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 px-2 py-1.5 border-b border-white/10 mb-1">
              <div className="w-7 h-7 rounded-lg overflow-hidden bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center font-black text-xs text-indigo-400 flex-shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  user?.email?.[0].toUpperCase() || 'U'
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] uppercase font-bold text-zinc-500">Signed In</p>
                <p className="text-xs font-bold text-zinc-200 truncate">{user?.email}</p>
              </div>
            </div>

            <nav className="space-y-0.5 text-xs font-semibold">
              <Link
                href="/profile"
                onClick={() => setUserMenuOpen(false)}
                className="w-full text-left px-2 py-1.5 rounded-xl text-zinc-300 hover:bg-white/5 flex items-center gap-2 transition"
              >
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>Profile Edit</span>
              </Link>

              <Link
                href="/library"
                onClick={() => setUserMenuOpen(false)}
                className="w-full text-left px-2 py-1.5 rounded-xl text-zinc-300 hover:bg-white/5 flex items-center gap-2 transition"
              >
                <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
                <span>Library Tracker</span>
              </Link>

              <Link
                href="/notifications"
                onClick={() => setUserMenuOpen(false)}
                className="w-full text-left px-2 py-1.5 rounded-xl text-zinc-300 hover:bg-white/5 flex items-center gap-2 transition"
              >
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span>Notifications</span>
              </Link>

              <Link
                href="/import-export"
                onClick={() => setUserMenuOpen(false)}
                className="w-full text-left px-2 py-1.5 rounded-xl text-zinc-300 hover:bg-white/5 flex items-center gap-2 transition"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Import / Export</span>
              </Link>

              <Link
                href="/settings"
                onClick={() => setUserMenuOpen(false)}
                className="w-full text-left px-2 py-1.5 rounded-xl text-zinc-300 hover:bg-white/5 flex items-center gap-2 transition"
              >
                <Settings className="w-3.5 h-3.5 text-cyan-400" />
                <span>Settings</span>
              </Link>

              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  setUserMenuOpen(false);
                  window.location.reload();
                }}
                className="w-full text-left px-2 py-1.5 rounded-xl text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 border-t border-white/5 pt-1.5 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* NOTIFICATION BELL POPOVER */}
      {notifPopoverOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-transparent" onClick={() => setNotifPopoverOpen(false)} />
          <div className="absolute top-14 right-14 sm:right-20 w-72 rounded-2xl bg-[#0e121b]/95 backdrop-blur-xl border border-white/10 shadow-2xl p-3 z-10 space-y-2 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-black text-white">Release Alerts</span>
              <button
                onClick={markAllNotifsRead}
                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Mark as read
              </button>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {unreadNotifs.map((n) => (
                <div key={n.id} className={`p-2 rounded-xl border text-xs transition ${n.unread ? 'bg-indigo-500/10 border-indigo-500/20 text-white' : 'bg-zinc-900 border-white/5 text-zinc-400'}`}>
                  <p className="font-bold truncate">{n.title}</p>
                  <p className="text-[10px] text-zinc-400">{n.desc} • {n.time}</p>
                </div>
              ))}
            </div>

            <Link
              href="/notifications"
              onClick={() => setNotifPopoverOpen(false)}
              className="block w-full py-1.5 text-center rounded-xl bg-zinc-900 hover:bg-zinc-800 text-[11px] font-bold text-zinc-300 transition"
            >
              See all notifications →
            </Link>
          </div>
        </div>
      )}

      {/* LIVE ⌘K SEARCH DIALOG */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSearchOpen(false)} />
          <div className="relative w-full max-w-xl bg-zinc-900 border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
              <Search className="w-4 h-4 text-zinc-400" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={totalCatalogCount ? `Search across ${totalCatalogCount.toLocaleString()} verified series...` : 'Search titles across all categories...'}
                className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-400 border border-white/10">
                ESC
              </kbd>
            </div>

            <div className="max-h-96 overflow-y-auto p-2 space-y-1">
              {searchLoading && (
                <div className="py-8 text-center text-xs text-zinc-500">Searching catalog...</div>
              )}
              {!searchLoading && searchResults.length === 0 && searchQuery.trim() && (
                <div className="py-8 text-center text-xs text-zinc-500">No series match this query.</div>
              )}
              {searchResults.map((item) => (
                <Link
                  key={item.id}
                  href={`/series/${item.id}`}
                  onClick={() => setSearchOpen(false)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition group"
                >
                  <img src={item.cover_url || '/placeholder.svg'} alt="" className="w-10 h-14 object-cover rounded-lg bg-zinc-800" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-zinc-200 group-hover:text-indigo-400 truncate">
                      {item.title_primary}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-400 uppercase font-bold">
                      <span className="text-indigo-400">{item.media_type}</span>
                      <span>•</span>
                      <span>{item.status}</span>
                      {item.score && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 text-amber-400">
                            <Star className="w-2.5 h-2.5 fill-amber-400" /> {item.score}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AUTH MODAL */}
      {authOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setAuthOpen(false)} />
          <div className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-2xl p-5 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-black text-sm text-white">Sign In to Omnidex</h3>
              <button onClick={() => setAuthOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {magicLinkSent ? (
              <div className="py-6 text-center space-y-2">
                <p className="text-sm font-bold text-emerald-400">Magic Link Dispatched!</p>
                <p className="text-xs text-zinc-400">Check your inbox to authenticate instantly.</p>
              </div>
            ) : (
              <form onSubmit={handleAuthSubmit} className="space-y-3 text-xs">
                {authError && <div className="text-rose-400 font-bold">{authError}</div>}
                <div>
                  <label className="text-zinc-400 block mb-1 font-semibold">Email Address:</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="reader@example.com"
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {isPasswordLogin && (
                  <div>
                    <label className="text-zinc-400 block mb-1 font-semibold">Password:</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 font-black text-white rounded-xl transition shadow-md shadow-indigo-600/30"
                >
                  {authLoading ? 'Verifying...' : isPasswordLogin ? 'Sign In' : 'Send Magic Link'}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setIsPasswordLogin((prev) => !prev)}
                    className="text-[11px] font-bold text-zinc-400 hover:text-indigo-400 transition"
                  >
                    {isPasswordLogin ? 'Switch to Passwordless Magic Link' : 'Switch to Email & Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-[#06080d] py-8 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-zinc-400">Omnidex — Official Media Tracker & Index Engine</p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-zinc-500 text-[11px]">
            <Link href="/filter" className="hover:text-indigo-400 transition">Filter Directory</Link>
            <span>•</span>
            <Link href="/trending" className="hover:text-indigo-400 transition">Trending</Link>
            <span>•</span>
            <Link href="/popular" className="hover:text-indigo-400 transition">Popular</Link>
            <span>•</span>
            <Link href="/latest" className="hover:text-indigo-400 transition">Latest</Link>
            <span>•</span>
            <Link href="/random" className="hover:text-indigo-400 transition">Random</Link>
          </div>
          <p className="text-[10px] text-zinc-600">100% Legal Tracking. Links redirect to verified publishers and licensed platforms.</p>
        </div>
      </footer>
    </div>
  );
}
