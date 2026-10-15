import type { Metadata, Viewport } from 'next';
import './globals.css';
import Link from 'next/link';
import { Compass, Bookmark, TrendingUp, Sparkles, Layers } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Omnidex — Universal Anime, Manga & Novel Directory',
  description: 'Discover trending Asian pop culture and track progress on official platforms.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Omnidex',
  },
};

export const viewport: Viewport = {
  themeColor: '#07090e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#07090e] text-slate-100 selection:bg-indigo-600 selection:text-white antialiased">
        {/* Top Navbar (AniList-inspired minimal glass header) */}
        <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#07090e]/85 backdrop-blur-md px-4 sm:px-8 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 via-indigo-600 to-pink-500 flex items-center justify-center font-black text-white text-base shadow-lg shadow-indigo-600/30">
                O
              </div>
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                Omnidex
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-400">
              <Link href="/" className="text-white hover:text-indigo-400 transition flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-indigo-400" /> Browse
              </Link>
              <Link href="/?type=manhwa" className="hover:text-indigo-400 transition flex items-center gap-1.5">
                <Layers className="w-4 h-4" /> Manhwa
              </Link>
              <Link href="/?type=anime" className="hover:text-indigo-400 transition flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Anime
              </Link>
              <Link href="/?type=novel" className="hover:text-indigo-400 transition flex items-center gap-1.5">
                <Bookmark className="w-4 h-4" /> Novels
              </Link>
            </nav>

            {/* Global Search Bar */}
            <form method="GET" action="/" className="w-full max-w-[200px] sm:max-w-xs">
              <input
                type="text"
                name="search"
                placeholder="Search all media..."
                className="w-full bg-[#111622] border border-slate-800 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </form>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 pb-20 md:pb-8">{children}</div>

        {/* Mobile PWA Bottom Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0c1017]/95 border-t border-slate-800/80 backdrop-blur-lg px-6 py-2.5 flex justify-around items-center text-[10px] font-medium text-slate-400">
          <Link href="/" className="flex flex-col items-center gap-1 text-indigo-400">
            <Compass className="w-5 h-5" />
            <span>Discover</span>
          </Link>
          <Link href="/?type=manhwa" className="flex flex-col items-center gap-1 hover:text-slate-200">
            <Layers className="w-5 h-5" />
            <span>Manhwa</span>
          </Link>
          <Link href="/?type=anime" className="flex flex-col items-center gap-1 hover:text-slate-200">
            <TrendingUp className="w-5 h-5" />
            <span>Anime</span>
          </Link>
          <Link href="/?type=novel" className="flex flex-col items-center gap-1 hover:text-slate-200">
            <Bookmark className="w-5 h-5" />
            <span>Novels</span>
          </Link>
        </nav>
      </body>
    </html>
  );
}
