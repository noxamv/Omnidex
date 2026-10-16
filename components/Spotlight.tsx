'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Spotlight({ item }: { item: any }) {
  if (!item) return null;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-[#0e121b] border border-slate-800/80 p-4 sm:p-5 mb-5 shadow-xl">
      <div className="flex items-center justify-between gap-4">
        {/* Left Information */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              SPOTLIGHT #1
            </span>
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {item.media_type}
            </span>
          </div>

          <Link href={`/series/${item.id}`} className="block">
            <h1 className="text-base sm:text-xl font-black text-white hover:text-indigo-400 transition truncate leading-snug">
              {item.title_primary}
            </h1>
          </Link>

          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed max-w-lg">
            {item.synopsis || 'Explore official tracking and release sources on Omnidex.'}
          </p>

          <div className="pt-1">
            <Link
              href={`/series/${item.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition active:scale-95"
            >
              <span>Read / Track Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Cover Image (Exact MangaFlow style) */}
        <Link
          href={`/series/${item.id}`}
          className="w-20 sm:w-28 aspect-[2/3] flex-shrink-0 rounded-xl overflow-hidden shadow-xl border border-slate-700/60 bg-slate-900 group"
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
