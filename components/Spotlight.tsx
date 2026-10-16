'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

export default function Spotlight({ item }: { item: any }) {
  if (!item) return null;

  const officialSources = (item.official_links as any[]) || [];
  const primarySource = officialSources[0];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-[#10141e] border border-slate-800/80 p-5 sm:p-7 mb-6 shadow-2xl">
      {/* Background soft blur banner */}
      <div className="absolute inset-0 z-0">
        <img
          src={item.banner_url || item.cover_url}
          alt={item.title_primary}
          className="w-full h-full object-cover object-center filter blur-md opacity-20 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#10141e] via-[#10141e]/70 to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col-reverse sm:flex-row items-center sm:items-stretch justify-between gap-6">
        {/* Left Information */}
        <div className="flex-1 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                SPOTLIGHT #1
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {item.media_type}
              </span>
            </div>

            <Link href={`/series/${item.id}`} className="block">
              <h1 className="text-xl sm:text-2xl font-black text-white hover:text-indigo-400 transition leading-tight">
                {item.title_primary}
              </h1>
            </Link>

            <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 leading-relaxed max-w-xl">
              {item.synopsis || 'Explore official tracking and legal release sources on Omnidex.'}
            </p>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3 pt-2">
            {primarySource ? (
              <a
                href={`/api/track?mediaId=${encodeURIComponent(item.id)}&target=${encodeURIComponent(primarySource.url)}&step=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5 active:scale-95"
              >
                <span>Read / Watch on {primarySource.site}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <Link
                href={`/series/${item.id}`}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold transition"
              >
                View Series Overview
              </Link>
            )}

            <Link
              href={`/series/${item.id}`}
              className="px-4 py-2.5 rounded-xl bg-[#171d2b] hover:bg-slate-800 text-slate-300 text-xs sm:text-sm font-bold border border-slate-700/60 transition"
            >
              Details
            </Link>
          </div>
        </div>

        {/* Right Cover Art Poster (MangaFlow Style) */}
        <Link
          href={`/series/${item.id}`}
          className="w-32 sm:w-40 aspect-[2/3] flex-shrink-0 rounded-xl overflow-hidden shadow-2xl border border-slate-700/60 bg-slate-900 group"
        >
          <img
            src={item.cover_url}
            alt={item.title_primary}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        </Link>
      </div>
    </div>
  );
}
