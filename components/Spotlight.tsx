// components/Spotlight.tsx
'use client';

import Link from 'next/link';
import { ArrowRight, Star, Sparkles, BookOpen } from 'lucide-react';

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
  if (!item) return null;

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-br from-[#101422] via-[#090c14] to-[#06080d] border border-white/[0.08] p-5 sm:p-7 shadow-2xl min-h-[220px] sm:min-h-[250px] flex flex-col justify-between">
      {/* Background Glow */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src={item.banner_url || item.cover_url}
          alt=""
          className="w-full h-full object-cover filter blur-2xl opacity-20 scale-125"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#06080d] via-[#06080d]/85 to-transparent" />
      </div>

      <div className="relative z-10 flex items-center justify-between gap-6 flex-1">
        <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-1 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> FEATURED #{index + 1}
            </span>
            <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-lg bg-zinc-800/80 text-zinc-300 border border-white/5">
              {item.media_type}
            </span>
            {item.score && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                <Star className="w-2.5 h-2.5 fill-amber-400" /> {item.score}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <Link href={`/series/${item.id}`} className="block">
              <h1 className="text-lg sm:text-2xl font-black text-white hover:text-indigo-400 transition truncate leading-snug">
                {item.title_primary}
              </h1>
            </Link>

            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed max-w-xl font-normal">
              {item.synopsis || 'Explore official tracking and release sources on Omnidex.'}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <Link
              href={`/series/${item.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-lg shadow-indigo-600/30 transition active:scale-95"
            >
              <span>Track Series</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {onSelectIndex && (
              <div className="flex items-center gap-1.5 pr-2">
                {Array.from({ length: total }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectIndex(idx)}
                    aria-label={`Jump to spotlight slide ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === idx ? 'w-6 bg-indigo-500' : 'w-2 bg-zinc-700 hover:bg-zinc-500'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <Link
          href={`/series/${item.id}`}
          className="w-24 sm:w-36 aspect-[2/3] flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-zinc-900 group"
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
