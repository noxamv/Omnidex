'use client';

import { useState, useEffect } from 'react';
import './globals.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { Menu, Search, Bell, User, X, LogIn, LogOut, Mail, CheckCircle2, ChevronRight } from 'lucide-react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  // Header Interactive States
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Search input
  const [searchQuery, setSearchQuery] = useState('');

  // Auth state
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

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
    setAuthOpen(false);
  };

  return (
    <html lang="en">
      <head>
        <title>Omnidex — Official Asian Media Tracker</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#0a0d14" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen bg-[#07090e] text-slate-100 selection:bg-indigo-600 antialiased font-sans">
        {/* Fixed Non-Shifting Header */}
        <header className="sticky top-0 z-50 h-14 bg-[#0a0d14]/95 backdrop-blur-md border-b border-slate-800/80 px-4">
          <div className="max-w-7xl h-full mx-auto flex items-center justify-between gap-3">
            {/* Left Top: Menu + Brand */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle menu"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
              >
                <Menu className="w-5 h-5" />
              </button>

              <Link href="/" className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 via-indigo-600 to-pink-500 flex items-center justify-center font-black text-white text-sm shadow-md shadow-indigo-600/30">
                  O
                </div>
                <span className="text-lg font-black tracking-tight text-white">
                  Omnidex
                </span>
              </Link>
            </div>

            {/* Desktop Center Minimal Search */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-sm mx-6">
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search series, authors, genres..."
                  className="w-full bg-[#111622] border border-slate-800/90 rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </form>

            {/* Right Top Icons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Search"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
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
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-[#0a0d14]" />
              </button>

              {user ? (
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  aria-label="User Account"
                  className="p-1.5 rounded-full bg-gradient-to-tr from-indigo-600 to-pink-600 text-white font-bold text-xs ring-2 ring-indigo-500/50"
                >
                  <User className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-bold border border-indigo-500/30 transition flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>

          {/* Interactive Search Bar Dropdown */}
          {searchOpen && (
            <div className="absolute top-14 left-0 right-0 bg-[#0a0d14] border-b border-slate-800 p-3 shadow-2xl">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center max-w-4xl mx-auto">
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type anime, manga, manhwa, or novel name..."
                  className="w-full bg-[#111622] border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5" />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-3 p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </header>

        {/* Slide-over Left Navigation Menu Drawer */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
            <div className="relative w-72 max-w-[80%] bg-[#0a0d14] border-r border-slate-800 h-full p-5 flex flex-col justify-between z-10 shadow-2xl">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-sm">
                      O
                    </div>
                    <span className="font-black text-white text-base">Omnidex Menu</span>
                  </div>
                  <button onClick={() => setMenuOpen(false)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-2">
                  {[
                    { label: 'All Catalog', href: '/' },
                    { label: 'Web & Light Novels', href: '/?type=novel' },
                    { label: 'Trending Manhwa', href: '/?type=manhwa' },
                    { label: 'Anime Releases', href: '/?type=anime' },
                    { label: 'Popular Manga', href: '/?type=manga' },
                  ].map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#111622] text-slate-300 hover:text-indigo-400 text-sm font-semibold transition"
                    >
                      <span>{link.label}</span>
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500">
                Omnidex Media Directory © 2026. Official & Licensed Outbound Only.
              </div>
            </div>
          </div>
        )}

        {/* Notifications Modal */}
        {notifOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setNotifOpen(false)} />
            <div className="relative w-full max-w-sm bg-[#0e121b] border border-slate-800 rounded-2xl p-5 shadow-2xl z-10 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-400" /> Notifications
                </h3>
                <button onClick={() => setNotifOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automatic sync runs every 30 minutes. You will receive notifications when bookmarked titles release new chapters.
              </p>
            </div>
          </div>
        )}

        {/* Supabase Magic Link Authentication Modal */}
        {authOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAuthOpen(false)} />
            <div className="relative w-full max-w-sm bg-[#0e121b] border border-slate-800 rounded-2xl p-6 shadow-2xl z-10 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-black text-sm text-white">
                  {user ? 'Account Profile' : 'Sign In with Magic Link'}
                </h3>
                <button onClick={() => setAuthOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {user ? (
                <div className="space-y-4 pt-1">
                  <div className="bg-[#111622] p-3 rounded-xl border border-slate-800 text-xs">
                    <span className="text-slate-500 block mb-0.5">Signed in as:</span>
                    <span className="text-white font-bold break-all">{user.email}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              ) : magicLinkSent ? (
                <div className="text-center py-4 space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="font-bold text-sm text-white">Magic Link Sent!</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Check your email inbox at <span className="text-indigo-400 font-semibold">{email}</span>. Click the link to log in instantly without passwords.
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
                    Enter your email to receive a secure, passwordless login link. Works for guests and existing accounts.
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
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition disabled:opacity-50"
                  >
                    {authLoading ? 'Sending...' : 'Send Magic Link'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        <main className="pb-16">{children}</main>
      </body>
    </html>
  );
}
