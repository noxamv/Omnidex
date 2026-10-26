// components/Spotlight.tsx
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Star, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

export default function Spotlight({ 
  item, 
  index = 0, 
  total = 7, 
  onSelectIndex 
}: { 
  item: any; 
  index?: number; 
  total?: number; 
  onSelectIndex?: (idx: number) => void;
}) {
  // Auto-play spotlight slide every 6 seconds
  useEffect(() => {
    if (!onSelectIndex || total <= 1) return;
    const timer = setInterval(() => {
      onSelectIndex((index + 1) % total);
    }, 6000);
    return () => clearInterval(timer);
  }, [index, total, onSelectIndex]);

  if (!item) return null;

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-[#0c101a] border border-white/[0.08] shadow-2xl p-5 sm:p-7 min-h-[220px] sm:min-h-[260px] flex flex-col justify-between group">
      {/* Background Poster Blur */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src={item.banner_url || item.cover_url}
          alt=""
          className="w-full h-full object-cover filter blur-2xl opacity-20 scale-125 transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c101a] via-[#0c101a]/90 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c101a] via-transparent to-transparent" />
      </div>

      <div className="relative z-10 flex items-center justify-between gap-5 sm:gap-8 flex-1">
        {/* Left Meta Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between h-full space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              FEATURED #{index + 1}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 border border-white/5">
              {item.media_type}
            </span>
            {item.score && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                <Star className="w-2.5 h-2.5 fill-amber-400" /> {item.score}
              </span>
            )}
          </div>

          <div className="space-y-1">
            <Link href={`/series/${item.id}`} className="block">
              <h1 className="text-lg sm:text-2xl font-black text-white hover:text-indigo-400 transition truncate leading-snug">
                {item.title_primary}
              </h1>
            </Link>
            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed max-w-xl font-normal">
              {item.synopsis || 'Explore official global release dates, reading milestones, and verified publisher licenses.'}
            </p>
          </div>

          {/* Action Row & Pagination Dots */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            <Link
              href={`/series/${item.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-lg shadow-indigo-600/30 transition active:scale-95"
            >
              <span>Track Series</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {onSelectIndex && (
              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                <button
                  onClick={() => onSelectIndex((index - 1 + total) % total)}
                  className="p-0.5 text-zinc-400 hover:text-white"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {Array.from({ length: total }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectIndex(idx)}
                    aria-label={`Slide ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === idx ? 'w-5 bg-indigo-500' : 'w-1.5 bg-zinc-700 hover:bg-zinc-500'
                    }`}
                  />
                ))}

                <button
                  onClick={() => onSelectIndex((index + 1) % total)}
                  className="p-0.5 text-zinc-400 hover:text-white"
                  aria-label="Next"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Cover Poster */}
        <Link
          href={`/series/${item.id}`}
          className="w-24 sm:w-36 aspect-[2/3] flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-zinc-900 group-hover:scale-105 transition duration-300"
        >
          <img
            src={item.cover_url || '/placeholder.svg'}
            alt={item.title_primary}
            className="w-full h-full object-cover"
          />
        </Link>
      </div>
    </div>
  );
}
