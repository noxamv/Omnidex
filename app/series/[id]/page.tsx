'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, ExternalLink, Star, Plus, Minus, Bookmark, Check, Share2 } from 'lucide-react';

export default function SeriesDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [series, setSeries] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string>('plan_to_read');
  const [copied, setCopied] = useState(false);

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
        // Load LocalStorage guest tracker
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

  const handleShare = async () => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      if (navigator.share) {
        try {
          await navigator.share({ title: series?.title_primary, url });
          return;
        } catch (e) {}
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-500 text-sm">
        Loading series details...
      </div>
    );
  }

  if (!series) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-3">
        <p className="text-slate-400">Series not found or failed to load.</p>
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
    <div className="min-h-screen bg-[#07090e] pb-24">
      {/* Top Banner Hero */}
      <div className="relative w-full h-56 sm:h-72 overflow-hidden bg-slate-900 border-b border-slate-800">
        <img
          src={series.banner_url || series.cover_url}
          alt={series.title_primary}
          className="w-full h-full object-cover filter blur-sm opacity-35 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-[#07090e]/60 to-transparent" />

        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 p-2 rounded-xl bg-black/60 backdrop-blur-md text-white hover:bg-black/90 transition z-20 flex items-center gap-1.5 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          onClick={handleShare}
          className="absolute top-4 right-4 p-2 rounded-xl bg-black/60 backdrop-blur-md text-white hover:bg-black/90 transition z-20"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Full-Size Body */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-24 relative z-10 space-y-6">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          {/* Main Poster */}
          <div className="w-36 sm:w-48 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-800 bg-slate-900 flex-shrink-0 mx-auto sm:mx-0">
            <img
              src={series.cover_url}
              alt={series.title_primary}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Core Info */}
          <div className="flex-1 space-y-2 text-center sm:text-left w-full">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {series.media_type}
              </span>
              <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                {series.status}
              </span>
              {series.score && (
                <span className="flex items-center gap-1 text-xs font-black text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" /> {series.score}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-3xl font-black text-white leading-tight">
              {series.title_primary}
            </h1>
            {series.title_secondary && (
              <p className="text-xs text-slate-400 italic">{series.title_secondary}</p>
            )}

            {/* Genres */}
            <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 pt-1">
              {(series.genres || []).map((genre: string) => (
                <span
                  key={genre}
                  className="text-[11px] px-2.5 py-0.5 rounded-lg bg-[#111622] text-slate-300 border border-slate-800"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Guest / User Tracker Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0e131d] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-indigo-400" />
              <span>Personal Tracker (Saved Locally)</span>
            </h2>
            <select
              value={status}
              onChange={(e) => updateStatus(e.target.value)}
              className="bg-[#111622] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
            >
              <option value="reading">Reading / Watching</option>
              <option value="completed">Completed</option>
              <option value="plan_to_read">Plan to Read</option>
              <option value="on_hold">On Hold</option>
              <option value="dropped">Dropped</option>
            </select>
          </div>

          <div className="flex items-center justify-between bg-[#111622] p-3 rounded-xl border border-slate-800/80">
            <span className="text-xs font-bold text-slate-300">
              {series.media_type === 'anime' ? 'Episodes Watched:' : 'Chapters Read:'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateProgress(progress - 1)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-12 text-center text-sm font-black text-indigo-400">
                {progress}
              </span>
              <button
                onClick={() => updateProgress(progress + 1)}
                className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition shadow-sm shadow-indigo-600/30"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Synopsis Section */}
        <div className="space-y-2">
          <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-400">
            Synopsis
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-[#0e131d]/60 p-4 rounded-xl border border-slate-800/60">
            {series.synopsis || 'No official synopsis currently indexed.'}
          </p>
        </div>

        {/* Official Legal Release Platforms */}
        <div className="space-y-3">
          <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-400">
            Official Streaming & Reading Sources
          </h2>

          {officialLinks.length === 0 ? (
            <p className="text-xs text-slate-500 bg-[#0e131d] p-4 rounded-xl border border-slate-800">
              No direct official web reader indexed yet for this entry.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {officialLinks.map((src: any) => (
                <a
                  key={src.url}
                  href={`/api/track?mediaId=${encodeURIComponent(series.id)}&target=${encodeURIComponent(src.url)}&step=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#0e131d] hover:bg-[#131a29] border border-slate-800 hover:border-indigo-500/50 transition group"
                >
                  <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition">
                    Read / Stream on {src.site}
                  </span>
                  <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
