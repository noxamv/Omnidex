'use client';

import { useState } from 'react';
import './globals.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, Search, Bell, User, X } from 'lucide-react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const router = useRouter();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/?search=${encodeURIComponent(searchVal.trim())}`);
      setSearchOpen(false);
    }
  };

  return (
    <html lang="en">
      <head>
        <title>Omnidex — Official Asian Media Tracker</title>
        <meta name="description" content="Track and discover Anime, Manga, Manhwa, and Light Novels legally." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#0a0d14" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen bg-[#07090e] text-slate-100 selection:bg-indigo-600 antialiased font-sans">
        {/* Fixed Non-Shifting Header */}
        <header className="sticky top-0 z-50 h-14 bg-[#0a0d14]/95 backdrop-blur-md border-b border-slate-800/80 px-4">
          <div className="max-w-7xl h-full mx-auto flex items-center justify-between gap-3">
            {/* Left Top: Menu & Brand */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Toggle Navigation Menu"
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

            {/* Desktop Minimal Search */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-sm mx-6">
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Search anime, manga, manhwa..."
                  className="w-full bg-[#111622] border border-slate-800/90 rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </form>

            {/* Right Top Icons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Search"
                className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
              >
                <Search className="w-5 h-5" />
              </button>

              <button
                type="button"
                aria-label="Notifications"
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition relative"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-[#0a0d14]" />
              </button>

              <button
                type="button"
                aria-label="User Account"
                className="p-1.5 rounded-full bg-slate-800/80 hover:ring-2 hover:ring-indigo-500/50 text-slate-300 ml-1 transition"
              >
                <User className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Expandable Mobile Search Dropdown */}
          {searchOpen && (
            <div className="md:hidden absolute top-14 left-0 right-0 bg-[#0a0d14] border-b border-slate-800 p-3 shadow-2xl">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <input
                  type="text"
                  autoFocus
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Search catalog titles..."
                  className="w-full bg-[#111622] border border-slate-700/80 rounded-xl pl-10 pr-10 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
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

        {/* Content */}
        <main className="pb-16">{children}</main>
      </body>
    </html>
  );
}
