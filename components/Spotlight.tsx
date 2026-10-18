'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

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
    <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-br from-[#121624] via-[#0d101a] to-[#090c14] border border-slate-800/80 p-4 sm:p-5 mb-3.5 shadow-xl min-h-[200px] sm:min-h-[215px] flex flex-col justify-between">
      {/* Background Soft Glow */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src={item.banner_url || item.cover_url}
          alt=""
          className="w-full h-full object-cover filter blur-xl opacity-15 scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d101a] via-[#0d101a]/90 to-transparent" />
      </div>

      <div className="relative z-10 flex items-center justify-between gap-4 flex-1">
        {/* Left Information */}
        <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5 space-y-2">
          {/* Top Meta: Side-by-side badges */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              SPOTLIGHT #{index + 1}
            </span>
            <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-slate-800/80 text-slate-300">
              {item.media_type}
            </span>
          </div>

          {/* Title & Synopsis */}
          <div className="space-y-1">
            <Link href={`/series/${item.id}`} className="block">
              <h1 className="text-base sm:text-xl font-black text-white hover:text-indigo-400 transition truncate leading-snug">
                {item.title_primary}
              </h1>
            </Link>

            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed max-w-lg">
              {item.synopsis || 'Explore official tracking and release sources on Omnidex.'}
            </p>
          </div>

          {/* Bottom Controls: Button on left, dots on right */}
          <div className="pt-2 flex items-center justify-between">
            <Link
              href={`/series/${item.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition active:scale-95"
            >
              <span>Read Now</span>
              <ArrowRight className="w-3 h-3" />
            </Link>

            {onSelectIndex && (
              <div className="flex items-center gap-1.5 pr-2">
                {Array.from({ length: total }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectIndex(idx)}
                    aria-label={`Jump to spotlight slide ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      index === idx ? 'w-5 bg-indigo-500' : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Cover Image */}
        <Link
          href={`/series/${item.id}`}
          className="w-24 sm:w-32 aspect-[2/3] flex-shrink-0 rounded-xl overflow-hidden shadow-2xl border border-slate-700/60 bg-slate-900 group"
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
