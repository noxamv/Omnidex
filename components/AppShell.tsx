// components/AppShell.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { 
  Menu, Search, X, LogIn, LogOut, Mail, 
  Bookmark, SlidersHorizontal, Settings2, RefreshCw, 
  Upload, FileDown, Smartphone, Check, Star, ExternalLink,
  Layers, ShieldAlert
} from 'lucide-react';

export const AVATAR_CHARACTERS = [
  { id: 'sjw', name: 'Sung Jin-woo', series: 'Solo Leveling', url: 'https://cdn.myanimelist.net/images/characters/8/531267.jpg' },
  { id: 'gojo', name: 'Satoru Gojo', series: 'Jujutsu Kaisen', url: 'https://cdn.myanimelist.net/images/characters/5/292491.jpg' },
  { id: 'luffy', name: 'Monkey D. Luffy', series: 'One Piece', url: 'https://cdn.myanimelist.net/images/characters/5/72194.jpg' },
  { id: 'frieren', name: 'Frieren', series: "Beyond Journey's End", url: 'https://cdn.myanimelist.net/images/characters/11/496739.jpg' },
  { id: 'denji', name: 'Denji', series: 'Chainsaw Man', url: 'https://cdn.myanimelist.net/images/characters/4/488583.jpg' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // User Auth State
  const [user, setUser] = useState<any>(null);
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

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  // Import State
  const [aniListUsername, setAniListUsername] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  // 1. Keyboard Shortcut Listener (⌘K / Ctrl+K) & PWA Banner Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
        setMenuOpen(false);
        setUserMenuOpen(false);
        setAuthOpen(false);
        setSyncModalOpen(false);
        setSettingsModalOpen(false);
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

  // 2. Auth Session & Guest Data Auto-Migration
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) migrateGuestLibrary(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) migrateGuestLibrary(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Focus Search Input on Open
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [searchOpen]);

  // Live Search Query Trigger
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
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Migrate Guest LocalStorage to Supabase user_tracker
  async function migrateGuestLibrary(userId: string) {
    try {
      const guestRaw = localStorage.getItem('omnidex_guest_library');
      if (!guestRaw) return;
      const guestList: any[] = JSON.parse(guestRaw);
      if (!guestList.length) return;

      const rows = guestList.map((item) => ({
        user_id: userId,
        media_id: item.id,
        progress: item.progress || 0,
        status: item.status || 'plan_to_read',
        is_following: true,
        updated_at: new Date().toISOString(),
      }));

      await supabase.from('user_tracker').upsert(rows, { onConflict: 'user_id,media_id' });
      localStorage.removeItem('omnidex_guest_library');
    } catch {}
  }

  // Handle PWA Install Click
  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstallBtn(false);
    setDeferredPrompt(null);
  };

  // Handle Authentication (Magic Link or Password)
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

  // Real AniList Public List Importer
  const handleAniListImport = async () => {
    if (!aniListUsername.trim()) return;
    setImportLoading(true);
    setImportMessage(null);

    const query = `
      query ($userName: String) {
        MediaListCollection(userName: $userName, type: MANGA) {
          lists {
            entries {
              progress
              status
              media {
                id
                title { english romaji }
              }
            }
          }
        }
      }
    `;

    try {
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { userName: aniListUsername.trim() } }),
      });
      const json = await res.json();
      const lists = json?.data?.MediaListCollection?.lists || [];
      const entries = lists.flatMap((l: any) => l.entries || []);

      if (!entries.length) {
        setImportMessage('No manga/manhwa tracking entries found for this user.');
        setImportLoading(false);
        return;
      }

      let importedCount = 0;
      for (const entry of entries) {
        const alId = `al-${entry.media.id}`;
        const cleanStatus = entry.status?.toLowerCase() === 'current' ? 'reading' : 'plan_to_read';

        if (user) {
          await supabase.from('user_tracker').upsert({
            user_id: user.id,
            media_id: alId,
            progress: entry.progress || 0,
            status: cleanStatus,
            is_following: true,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,media_id' });
          importedCount++;
        } else {
          let guest = JSON.parse(localStorage.getItem('omnidex_guest_library') || '[]');
          const idx = guest.findIndex((g: any) => g.id === alId);
          const obj = { id: alId, progress: entry.progress || 0, status: cleanStatus };
          if (idx >= 0) guest[idx] = obj;
          else guest.push(obj);
          localStorage.setItem('omnidex_guest_library', JSON.stringify(guest));
          importedCount++;
        }
      }

      setImportMessage(`🎉 Successfully imported ${importedCount} series from AniList!`);
      setTimeout(() => {
        setSyncModalOpen(false);
        setImportMessage(null);
        window.location.reload();
      }, 1500);
    } catch {
      setImportMessage('Failed to fetch AniList data. Please check username spelling.');
    } finally {
      setImportLoading(false);
    }
  };

  // Export JSON Backup
  const handleExportBackup = async () => {
    let exportData = [];
    if (user) {
      const { data } = await supabase.from('user_tracker').select('*').eq('user_id', user.id);
      exportData = data || [];
    } else {
      exportData = JSON.parse(localStorage.getItem('omnidex_guest_library') || '[]');
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnidex_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#06080d] text-zinc-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full bg-[#06080d]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-xs shadow-md shadow-indigo-600/30 group-hover:scale-105 transition">
                Ω
              </div>
              <span className="font-black text-sm tracking-tight text-white group-hover:text-indigo-400 transition">
                Omnidex
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link href="/" className="px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/5 transition">
                Discover
              </Link>
              <Link href="/library" className="px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/5 transition flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
                <span>Library</span>
              </Link>
              <Link href="/filter" className="px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/5 transition flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
                <span>Filter</span>
              </Link>
            </nav>
          </div>

          {/* Search Trigger (⌘K) & Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-white/10 text-zinc-400 hover:text-zinc-200 transition text-xs font-medium"
            >
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Search series...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-zinc-800 border border-white/10 text-[10px] font-mono text-zinc-400">
                ⌘K
              </kbd>
            </button>

            {/* PWA Install Button */}
            {showInstallBtn && (
              <button
                onClick={handleInstallPWA}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 transition text-xs font-bold"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Install App</span>
              </button>
            )}

            {/* Sync / Importer Trigger */}
            <button
              onClick={() => setSyncModalOpen(true)}
              className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white transition"
              title="Import & Sync"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            </button>

            {/* Auth / Avatar State */}
            {user ? (
              <button
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-black text-xs text-indigo-400 hover:border-indigo-400 transition"
              >
                {user.email?.[0].toUpperCase() || 'U'}
              </button>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition shadow-sm shadow-indigo-600/30"
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="md:hidden p-2 rounded-xl bg-zinc-900/80 border border-white/10 text-zinc-400 hover:text-white"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-[#06080d]/95 backdrop-blur-2xl p-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <span className="font-black text-base text-white">Menu Navigation</span>
              <button onClick={() => setMenuOpen(false)} className="p-2 rounded-lg bg-zinc-900 text-zinc-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-3 font-bold text-sm">
              <Link href="/" onClick={() => setMenuOpen(false)} className="p-3 rounded-xl bg-zinc-900/60 border border-white/5">
                Discover Catalog
              </Link>
              <Link href="/library" onClick={() => setMenuOpen(false)} className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 flex items-center justify-between">
                <span>My Library Tracker</span>
                <Bookmark className="w-4 h-4 text-indigo-400" />
              </Link>
              <Link href="/filter" onClick={() => setMenuOpen(false)} className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 flex items-center justify-between">
                <span>Advanced Filter</span>
                <SlidersHorizontal className="w-4 h-4 text-zinc-400" />
              </Link>
              {showInstallBtn && (
                <button
                  onClick={() => {
                    handleInstallPWA();
                    setMenuOpen(false);
                  }}
                  className="p-3 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 font-bold flex items-center justify-between"
                >
                  <span>Install Omnidex PWA</span>
                  <Smartphone className="w-4 h-4" />
                </button>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* User Dropdown */}
      {userMenuOpen && (
        <div className="fixed top-16 right-4 sm:right-6 w-56 rounded-2xl bg-zinc-900/95 backdrop-blur-2xl border border-white/10 shadow-2xl z-50 p-2 space-y-1">
          <div className="px-3 py-2 border-b border-white/10">
            <p className="text-[10px] uppercase font-bold text-zinc-500">Authenticated Account</p>
            <p className="text-xs font-bold text-zinc-200 truncate">{user?.email}</p>
          </div>
          <button
            onClick={() => {
              setSyncModalOpen(true);
              setUserMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:bg-white/5 flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span>Import & Export</span>
          </button>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              setUserMenuOpen(false);
              window.location.reload();
            }}
            className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      )}

      {/* Universal ⌘K Search Modal */}
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
                placeholder="Search across 2,825 verified series..."
                className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-400 border border-white/10">
                ESC
              </kbd>
            </div>

            <div className="max-h-96 overflow-y-auto p-2 space-y-1">
              {searchLoading && (
                <div className="py-8 text-center text-xs text-zinc-500">Searching indexed catalog...</div>
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

      {/* Sync & AniList Import Modal */}
      {syncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSyncModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-2xl p-5 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-black text-sm text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-indigo-400" /> Import & Sync
              </h3>
              <button onClick={() => setSyncModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-zinc-950 border border-white/5 space-y-2">
                <label className="font-bold text-zinc-300 block">Import from AniList Username:</label>
                <div className="flex gap-2">
                  <input
                    value={aniListUsername}
                    onChange={(e) => setAniListUsername(e.target.value)}
                    placeholder="e.g., your_username"
                    className="flex-1 bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleAniListImport}
                    disabled={importLoading || !aniListUsername.trim()}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold rounded-lg transition"
                  >
                    {importLoading ? '...' : 'Sync'}
                  </button>
                </div>
              </div>

              {importMessage && (
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold text-center">
                  {importMessage}
                </div>
              )}

              <button
                onClick={handleExportBackup}
                className="w-full p-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-white/5 flex items-center justify-between text-zinc-300 font-bold transition"
              >
                <span>Export Omnidex Backup (.json)</span>
                <FileDown className="w-4 h-4 text-indigo-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
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

      {/* Main Page Slot */}
      <main className="flex-1">{children}</main>

      {/* Minimal Footer */}
      <footer className="border-t border-white/[0.06] bg-[#06080d] py-8 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-zinc-400">Omnidex — Official Media Tracker & Index</p>
          <p className="text-[11px]">100% Legal Tracking. Links redirect to verified publishers and licensed platforms.</p>
        </div>
      </footer>
    </div>
  );
}
