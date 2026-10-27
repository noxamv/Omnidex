// components/Spotlight.tsx
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';

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
  useEffect(() => {
    if (!onSelectIndex || total <= 1) return;
    const timer = setInterval(() => {
      onSelectIndex((index + 1) % total);
    }, 5500);
    return () => clearInterval(timer);
  }, [index, total, onSelectIndex]);

  if (!item) return null;

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-[#0c101a] border border-white/[0.08] shadow-2xl p-4 min-h-[185px] sm:min-h-[205px] flex flex-col justify-between group">
      {/* Background Poster Blur with no-referrer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src={item.banner_url || item.cover_url}
          alt=""
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover filter blur-2xl opacity-20 scale-125 transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c101a] via-[#0c101a]/90 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c101a] via-transparent to-transparent" />
      </div>

      <div className="relative z-10 flex items-stretch justify-between gap-4 flex-1">
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                SPOTLIGHT #{index + 1}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-white/5">
                {item.media_type}
              </span>
              {item.score && (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 fill-amber-400" /> {item.score}
                </span>
              )}
            </div>

            <div>
              <Link href={`/series/${item.id}`} className="block">
                <h1 className="text-base sm:text-lg font-black text-white hover:text-indigo-400 transition truncate leading-tight">
                  {item.title_primary}
                </h1>
              </Link>
              {item.title_secondary && (
                <p className="text-[11px] text-zinc-400 truncate font-medium">
                  {item.title_secondary}
                </p>
              )}
            </div>

            <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed max-w-lg font-normal">
              {item.synopsis || 'Explore official global release dates, reading milestones, and verified publisher licenses.'}
            </p>
          </div>

          <div className="pt-2">
            <Link
              href={`/series/${item.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md shadow-indigo-600/30 transition active:scale-95"
            >
              <span>Track Series</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Poster with no-referrer */}
        <Link
          href={`/series/${item.id}`}
          className="w-24 sm:w-28 aspect-[2/3] flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-zinc-900 group-hover:scale-105 transition duration-300 self-center"
        >
          <img
            src={item.cover_url || '/placeholder.svg'}
            alt={item.title_primary}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </Link>
      </div>

      {onSelectIndex && (
        <div className="relative z-10 flex items-center justify-center gap-1.5 pt-2">
          {Array.from({ length: total }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => onSelectIndex(idx)}
              aria-label={`Jump to spotlight slide ${idx + 1}`}
              className={`h-1 rounded-full transition-all duration-300 ${
                index === idx ? 'w-5 bg-indigo-500' : 'w-1.5 bg-zinc-700 hover:bg-zinc-500'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
