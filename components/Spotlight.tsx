'use client';

import ShareBar from './ShareBar';
import { ExternalLink, Flame, Star } from 'lucide-react';

export default function Spotlight({ item }: { item: any }) {
  if (!item) return null;

  const officialSources = (item.official_links as any[]) || [];
  const primarySource = officialSources[0];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800/80 bg-[#0e131d] shadow-2xl mb-10">
      {/* Background Banner with gradient overlays */}
      <div className="absolute inset-0 z-0">
        <img
          src={item.banner_url || item.cover_url}
          alt={item.title_primary}
          className="w-full h-full object-cover object-center filter blur-sm opacity-25 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e131d] via-[#0e131d]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0e131d] via-[#0e131d]/90 to-transparent" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 p-6 sm:p-10 flex flex-col md:flex-row gap-6 items-start md:items-end">
        {/* Cover Poster */}
        <div className="w-36 sm:w-44 aspect-[3/4] flex-shrink-0 rounded-xl overflow-hidden shadow-2xl border border-slate-700/60 bg-slate-900 hidden xs:block">
          <img
            src={item.cover_url}
            alt={item.title_primary}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Details & Actions */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Flame className="w-3 h-3" /> #1 Spotlight
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {item.media_type}
            </span>
            {item.score && (
              <span className="flex items-center gap-1 text-xs font-bold text-amber-400 ml-1">
                <Star className="w-3.5 h-3.5 fill-amber-400" /> {item.score}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            {item.title_primary}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 max-w-3xl leading-relaxed">
            {item.synopsis || 'No synopsis provided for this title.'}
          </p>

          {/* Genres Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {(item.genres || []).slice(0, 5).map((genre: string) => (
              <span
                key={genre}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/50"
              >
                {genre}
              </span>
            ))}
          </div>

          {/* Action Button Row */}
          <div className="flex items-center gap-3 pt-3">
            {primarySource ? (
              <a
                href={`/api/track?mediaId=${item.id}&target=${encodeURIComponent(primarySource.url)}&step=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition transform active:scale-95"
              >
                <span>Read / Watch on {primarySource.site}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <span className="text-xs text-slate-500 bg-slate-800/50 px-4 py-2 rounded-lg">
                Directory Indexed
              </span>
            )}

            <ShareBar title={item.title_primary} slug={item.slug} />
          </div>
        </div>
      </div>
    </div>
  );
}
