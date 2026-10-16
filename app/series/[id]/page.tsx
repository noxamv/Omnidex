'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, ExternalLink, Star, Plus, Minus, Bookmark, Globe, ChevronDown, ChevronUp } from 'lucide-react';

const PLATFORM_LANGUAGES: Record<string, string> = {
  crunchyroll: 'English Sub/Dub (Multi)',
  netflix: 'Multi-Language (Sub/Dub)',
  webtoon: 'English, Korean, French, Spanish',
  tapas: 'English',
  tappytoon: 'English, French, German',
  'royal road': 'English (Original Web Novel)',
  webnovel: 'English & Global Multi',
  wattpad: 'English & Global',
  'manga plus': 'English, Spanish, French',
  bookwalker: 'English & Japanese',
  'j-novel club': 'English (Official Light Novel)',
  'yen press': 'English',
  hidive: 'English Sub/Dub',
  youtube: 'Multi-sub (Muse Asia / Ani-One)'
};

function getPlatformLanguage(siteName: string): string {
  const lower = (siteName || '').toLowerCase();
  for (const [key, lang] of Object.entries(PLATFORM_LANGUAGES)) {
    if (lower.includes(key)) return lang;
  }
  return 'English / Original';
}

export default function SeriesDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [series, setSeries] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string>('plan_to_read');

  useEffect(() => {
    async function loadSeries() {
      if (!id) return;
      setLoading(true);

      const { data } = await supabase
        .from('media_catalog')
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        setSeries(data);
        const localTrack = localStorage.getItem(`omnidex_track_${data.id}`);
        if (localTrack) {
          try {
            const parsed = JSON.parse(localTrack);
            setProgress(parsed.progress || 0);
            setStatus(parsed.status || 'reading');
          } catch (e) {}
        }
      }
      setLoading(false);
    }
    loadSeries();
  }, [id]);

  const updateProgress = (newVal: number) => {
    const val = Math.max(0, newVal);
    setProgress(val);
    if (series) {
      localStorage.setItem(
        `omnidex_track_${series.id}`,
        JSON.stringify({ progress: val, status, updated_at: new Date().toISOString() })
      );
    }
  };

  const updateStatus = (newStatus: string) => {
    setStatus(newStatus);
    if (series) {
      localStorage.setItem(
        `omnidex_track_${series.id}`,
        JSON.stringify({ progress, status: newStatus, updated_at: new Date().toISOString() })
      );
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center text-slate-500 text-xs">
        Loading series catalog...
      </div>
    );
  }

  if (!series) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-3">
        <p className="text-slate-400 text-sm">Series not found.</p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          Return Home
        </button>
      </div>
    );
  }

  const officialLinks = (series.official_links as any[]) || [];

  return (
    <div className="min-h-screen bg-[#07090e] pb-20">
      {/* 1. Header Banner & Navigation */}
      <div className="relative w-full h-44 sm:h-64 overflow-hidden bg-slate-900 border-b border-slate-800">
        <img
          src={series.banner_url || series.cover_url}
          alt={series.title_primary}
          className="w-full h-full object-cover filter blur-[2px] opacity-35 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-[#07090e]/60 to-transparent" />

        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 p-2 rounded-xl bg-black/60 backdrop-blur-md text-white hover:bg-black/90 transition z-20 flex items-center gap-1.5 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-20 relative z-10 space-y-5">
        {/* A. Series Core Info */}
        <div className="flex gap-4 items-start">
          <div className="w-28 sm:w-36 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-900 flex-shrink-0">
            <img
              src={series.cover_url}
              alt={series.title_primary}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0 space-y-1.5 pt-6 sm:pt-10">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {series.media_type}
              </span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {series.status}
              </span>
              {series.score && (
                <span className="flex items-center gap-1 text-xs font-black text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" /> {series.score}
                </span>
              )}
            </div>

            <h1 className="text-lg sm:text-2xl font-black text-white leading-tight">
              {series.title_primary}
            </h1>
            {series.title_secondary && (
              <p className="text-xs text-slate-400 italic truncate">{series.title_secondary}</p>
            )}

            <div className="flex flex-wrap gap-1 pt-1">
              {(series.genres || []).map((genre: string) => (
                <span
                  key={genre}
                  className="text-[10px] px-2 py-0.5 rounded bg-[#111622] text-slate-400 border border-slate-800"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Synopsis with Read More Toggle */}
        <div className="bg-[#0e121b] p-4 rounded-xl border border-slate-800 space-y-2">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Synopsis
          </h2>
          <p
            className={`text-xs text-slate-300 leading-relaxed transition-all ${
              synopsisExpanded ? '' : 'line-clamp-3'
            }`}
          >
            {series.synopsis || 'No synopsis provided for this title.'}
          </p>
          {series.synopsis && series.synopsis.length > 140 && (
            <button
              onClick={() => setSynopsisExpanded(!synopsisExpanded)}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 pt-1"
            >
              <span>{synopsisExpanded ? 'Show Less' : 'Read More'}</span>
              {synopsisExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* B. Track Option (Local + User) */}
        <div className="bg-[#0e121b] p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
              <span>Track Progress</span>
            </h2>
            <select
              value={status}
              onChange={(e) => updateStatus(e.target.value)}
              className="bg-[#111622] border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
            >
              <option value="reading">Reading / Watching</option>
              <option value="completed">Completed</option>
              <option value="plan_to_read">Plan to Read</option>
              <option value="on_hold">On Hold</option>
              <option value="dropped">Dropped</option>
            </select>
          </div>

          <div className="flex items-center justify-between bg-[#111622] px-3.5 py-2.5 rounded-xl border border-slate-800">
            <span className="text-xs font-bold text-slate-300">
              {series.media_type === 'anime' ? 'Episodes Watched:' : 'Chapters Read:'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateProgress(progress - 1)}
                className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-10 text-center text-sm font-black text-indigo-400">
                {progress}
              </span>
              <button
                onClick={() => updateProgress(progress + 1)}
                className="p-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* C. Official Links with Provided Languages */}
        <div className="space-y-2.5">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Official Reading & Streaming Sources
          </h2>

          {officialLinks.length === 0 ? (
            <p className="text-xs text-slate-500 bg-[#0e121b] p-3.5 rounded-xl border border-slate-800">
              No official outbound web sources currently verified for this title.
            </p>
          ) : (
            <div className="space-y-2">
              {officialLinks.map((src: any) => {
                const languageInfo = getPlatformLanguage(src.site);

                return (
                  <a
                    key={src.url}
                    href={`/api/track?mediaId=${encodeURIComponent(series.id)}&target=${encodeURIComponent(src.url)}&step=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-[#0e121b] hover:bg-[#131a29] border border-slate-800 hover:border-indigo-500/50 transition group"
                  >
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition block">
                        Read / Stream on {src.site}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Globe className="w-3 h-3 text-indigo-400" />
                        <span>Language: {languageInfo}</span>
                      </span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition" />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
