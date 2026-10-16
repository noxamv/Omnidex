'use client';

import { ExternalLink, Star } from 'lucide-react';
import ShareBar from './ShareBar';

export default function Spotlight({ item }: { item: any }) {
  if (!item) return null;

  const officialSources = (item.official_links as any[]) || [];
  const primarySource = officialSources[0];

  return (
    // Exact 16:10 ratio (16:9 widescreen + 10% vertical space)
    <div className="relative w-full aspect-[16/10] sm:aspect-[21/9] max-h-[340px] rounded-2xl overflow-hidden border border-slate-800/70 bg-[#0e131d] shadow-xl mb-6">
      {/* Background artwork */}
      <div className="absolute inset-0 z-0">
        <img
          src={item.banner_url || item.cover_url}
          alt={item.title_primary}
          className="w-full h-full object-cover object-center filter blur-[2px] opacity-30 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e131d] via-[#0e131d]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0e131d] via-[#0e131d]/85 to-transparent" />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 h-full p-4 sm:p-6 flex items-end">
        <div className="flex gap-4 items-end w-full">
          {/* Normal 2:3 Standard Poster */}
          <div className="w-20 sm:w-28 aspect-[2/3] flex-shrink-0 rounded-lg overflow-hidden shadow-2xl border border-slate-700/60 bg-slate-900 hidden xs:block">
            <img
              src={item.cover_url}
              alt={item.title_primary}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {item.media_type}
              </span>
              {item.score && (
                <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
                  <Star className="w-3 h-3 fill-amber-400" /> {item.score}
                </span>
              )}
            </div>

            <h1 className="text-base sm:text-2xl font-black text-white truncate leading-tight">
              {item.title_primary}
            </h1>

            <p className="text-xs text-slate-300 line-clamp-2 max-w-xl leading-relaxed hidden sm:block">
              {item.synopsis || 'Explore official tracking and release sources on Omnidex.'}
            </p>

            <div className="flex items-center gap-2 pt-1">
              {primarySource ? (
                <a
                  href={`/api/track?mediaId=${encodeURIComponent(item.id)}&target=${encodeURIComponent(primarySource.url)}&step=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition active:scale-95"
                >
                  <span>{primarySource.site}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span className="text-xs text-slate-500 bg-slate-800/40 px-3 py-1.5 rounded-lg">
                  Indexed
                </span>
              )}

              <ShareBar title={item.title_primary} slug={item.slug} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
