import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'OmniIndex | Universal Anime, Manga & Novel Directory',
  description: 'Track and discover legal official releases across Anime, Manga, Manhwa, Manhua, and Light/Web Novels.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#080a0f]">
        <header className="sticky top-0 z-50 border-b border-[#1c2333] bg-[#080a0f]/90 backdrop-blur-md px-6 py-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
                OmniIndex
              </span>
              <span className="text-[10px] tracking-wide uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                Official Directory
              </span>
            </Link>

            <form method="GET" action="/" className="w-full sm:w-80">
              <input
                type="text"
                name="search"
                placeholder="Search catalog..."
                className="w-full bg-[#10141d] border border-[#1c2333] rounded-lg px-3.5 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </form>
          </div>
        </header>

        <div className="flex-1">{children}</div>

        <footer className="border-t border-[#1c2333] py-6 px-6 text-center text-xs text-slate-500">
          <p>OmniIndex tracks and routes users exclusively to official, licensed platforms (Crunchyroll, WEBTOON, Tapas, BookWalker, Royal Road).</p>
        </footer>
      </body>
    </html>
  );
}
