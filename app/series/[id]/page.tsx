// app/series/[id]/page.tsx
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import { 
  ArrowLeft, ExternalLink, Star, Plus, Minus, Bookmark, 
  Globe, ChevronDown, ChevronUp, Flag, X, CheckCheck, 
  Share2, Layers, Sparkles, BookOpen, Clock, Calendar, 
  CheckCircle2, ListFilter, ArrowUpDown
} from 'lucide-react';

const PLATFORM_LANGUAGES: Record<string, { label: string; badge: string; color: string }> = {
  crunchyroll: { label: 'Crunchyroll', badge: 'Official Anime Simulcast (Sub/Dub)', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  netflix: { label: 'Netflix', badge: 'Official Multi-Language Stream', color: 'text-rose-400 border-rose-500/30 bg-rose-500/10' },
  webtoon: { label: 'WEBTOON', badge: 'Official Global Webtoon (English / French / Spanish)', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  'naver webtoon': { label: 'Naver Webtoon', badge: 'Official Korean Raw (KOR)', color: 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10' },
  tapas: { label: 'Tapas', badge: 'Official Licensed Serialization (ENG)', color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' },
  tappytoon: { label: 'Tappytoon', badge: 'Official Publisher Webtoon (ENG/EU)', color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' },
  'royal road': { label: 'Royal Road', badge: 'Original Author Web Novel', color: 'text-sky-400 border-sky-500/30 bg-sky-500/10' },
  webnovel: { label: 'Webnovel (Qidian)', badge: 'Official Publisher Serialization', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  'manga plus': { label: 'MANGA Plus (Shueisha)', badge: 'Official Simulpub (ENG/ESP)', color: 'text-red-400 border-red-500/30 bg-red-500/10' },
  bookwalker: { label: 'BookWalker', badge: 'Official Digital E-Book (Kadokawa)', color: 'text-orange-400 border-orange-500/30 bg-orange-500/10' },
  'j-novel club': { label: 'J-Novel Club', badge: 'Official Light Novel Translation', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
  'yen press': { label: 'Yen Press', badge: 'Official Licensed Volume', color: 'text-pink-400 border-pink-500/30 bg-pink-500/10' },
};

function getPlatformMeta(siteName: string) {
  const lower = (siteName || '').toLowerCase();
  for (const [key, meta] of Object.entries(PLATFORM_LANGUAGES)) {
    if (lower.includes(key)) return meta;
  }
  return { label: siteName || 'Official Source', badge: 'Verified Official Platform', color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10' };
}

export default function SeriesDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [series, setSeries] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  
  const [user, setUser] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string>('plan_to_read');
  const [userRating, setUserRating] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Chapter Directory Sorting
  const [chapterSortAsc, setChapterSortAsc] = useState(false);

  // Report Modal
  const [reportOpen, setReportOpen] = useState(false);
  const [reportType, setReportType] = useState('broken_link');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const [, startTransition] = useTransition();

  useEffect(() => {
    async function loadSeries() {
      if (!id) return;
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      const { data } = await supabase
        .from('media_catalog')
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        setSeries(data);

        if (currentUser) {
          const { data: track } = await supabase
            .from('user_tracker')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('media_id', data.id)
            .maybeSingle();

          if (track) {
            setProgress(track.progress || 0);
            setStatus(track.status || 'plan_to_read');
            setIsFollowing(track.is_following ?? true);
            setUserRating(track.rating || 0);
          }
        } else {
          try {
            const guest = JSON.parse(localStorage.getItem('omnidex_guest_library') || '[]');
            const local = guest.find((g: any) => g.id === data.id);
            if (local) {
              setProgress(local.progress || 0);
              setStatus(local.status || 'plan_to_read');
              setIsFollowing(true);
              setUserRating(local.rating || 0);
            }
          } catch {}
        }
      }
      setLoading(false);
    }
    loadSeries();
  }, [id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const syncTracker = (nextProg: number, nextStatus: string, nextFollow: boolean, nextRating: number) => {
    if (user) {
      supabase.from('user_tracker').upsert({
        user_id: user.id,
        media_id: series.id,
        progress: nextProg,
        status: nextStatus,
        is_following: nextFollow,
        rating: nextRating > 0 ? nextRating : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,media_id' }).then();
    } else {
      try {
        let guest = JSON.parse(localStorage.getItem('omnidex_guest_library') || '[]');
        if (nextFollow) {
          const idx = guest.findIndex((g: any) => g.id === series.id);
          const entry = { id: series.id, progress: nextProg, status: nextStatus, rating: nextRating };
          if (idx >= 0) guest[idx] = entry;
          else guest.push(entry);
        } else {
          guest = guest.filter((g: any) => g.id !== series.id);
        }
        localStorage.setItem('omnidex_guest_library', JSON.stringify(guest));
      } catch {}
    }
  };

  const handleProgressChange = (newVal: number) => {
    const total = series?.total_units || 0;
    const clamped = Math.max(0, total > 0 ? Math.min(newVal, total) : newVal);
    setProgress(clamped);

    let nextStatus = status;
    if (total > 0 && clamped >= total) {
      nextStatus = 'completed';
      setStatus('completed');
      showToast('🎉 Series completed!');
    } else if (clamped > 0 && status === 'plan_to_read') {
      nextStatus = 'reading';
      setStatus('reading');
    }

    startTransition(() => {
      syncTracker(clamped, nextStatus, isFollowing, userRating);
    });
  };

  const handleRatingChange = (newRating: number) => {
    setUserRating(newRating);
    showToast(`Rated ${newRating}/10 ⭐`);
    startTransition(() => {
      syncTracker(progress, status, isFollowing, newRating);
    });
  };

  const toggleFollow = () => {
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    showToast(nextState ? 'Added to Tracking Library' : 'Removed from Library');
    startTransition(() => {
      syncTracker(progress, status, nextState, userRating);
    });
  };

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('media_reports').insert({
      media_id: series.id,
      user_id: user?.id || null,
      issue_type: reportType,
      details: reportDetails,
    });
    setReportSubmitted(true);
    setTimeout(() => {
      setReportSubmitted(false);
      setReportOpen(false);
      setReportDetails('');
    }, 1800);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06080d] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <span className="text-xs font-semibold text-zinc-500 tracking-wider uppercase">Loading verified metadata...</span>
        </div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-[#06080d] flex flex-col items-center justify-center p-4">
        <p className="text-zinc-400 text-sm mb-4">Series not cataloged or temporarily unavailable.</p>
        <button onClick={() => router.push('/')} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition">
          Return to Discover
        </button>
      </div>
    );
  }

  const rawLinks = (series.official_links as any[]) || [];
  const uniqueLinks = Array.from(new Map(rawLinks.filter(l => l && l.url).map(l => [l.url, l])).values());
  const totalUnits = series.total_units || 0;
  const isMaxProgress = totalUnits > 0 && progress >= totalUnits;
  const completionPercentage = totalUnits > 0 ? Math.min(100, Math.round((progress / totalUnits) * 100)) : 0;

  // Build chapter directory list (up to totalUnits or 50 preview chapters)
  const directoryCount = totalUnits > 0 ? totalUnits : Math.max(progress + 15, 30);
  const chapterNumbers = Array.from({ length: directoryCount }, (_, i) => i + 1);
  const displayChapters = chapterSortAsc ? chapterNumbers : [...chapterNumbers].reverse();

  return (
    <div className="min-h-screen bg-[#06080d] text-zinc-100 pb-28 selection:bg-indigo-500/30">
      {/* Immersive Hero Header */}
      <div className="relative w-full h-64 sm:h-96 overflow-hidden bg-zinc-950 border-b border-white/[0.06]">
        <img
          src={series.banner_url || series.cover_url}
          alt=""
          className="w-full h-full object-cover filter blur-[10px] opacity-30 scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06080d] via-[#06080d]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#06080d]/90 via-transparent to-[#06080d]/90" />

        <div className="absolute top-5 left-4 sm:left-8 right-4 sm:right-8 flex items-center justify-between z-20">
          <button
            onClick={() => router.back()}
            className="p-2.5 rounded-xl bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/10 text-zinc-300 hover:text-white transition flex items-center gap-2 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: series.title_primary, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  showToast('Link copied to clipboard');
                }
              }}
              className="p-2.5 rounded-xl bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/10 text-zinc-300 hover:text-white transition"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setReportOpen(true)}
              className="p-2.5 rounded-xl bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/10 text-zinc-300 hover:text-white transition"
              title="Report issue"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 -mt-32 sm:-mt-44 relative z-10 space-y-7">
        {/* Core Media Showcase */}
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Poster Card */}
          <div className="w-36 sm:w-52 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl shadow-black/90 border border-white/15 bg-zinc-900 flex-shrink-0 relative group">
            <img src={series.cover_url || '/placeholder.svg'} alt={series.title_primary} className="w-full h-full object-cover" />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-black uppercase text-indigo-300 border border-white/10">
              {series.format || series.media_type}
            </div>
          </div>

          {/* Details & Specs */}
          <div className="flex-1 min-w-0 space-y-3 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {series.media_type}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-zinc-800/80 text-zinc-300 border border-white/5">
                {series.status}
              </span>
              {series.score && (
                <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {series.score}
                </span>
              )}
              {totalUnits > 0 && (
                <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/5">
                  <BookOpen className="w-3 h-3 text-indigo-400" /> {totalUnits} {series.media_type === 'anime' ? 'Episodes' : 'Chapters'} Total
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              {series.title_primary}
            </h1>

            {series.title_secondary && (
              <p className="text-xs sm:text-sm font-medium text-zinc-400 truncate">
                {series.title_secondary}
              </p>
            )}

            {/* Genres Tag Cloud */}
            {Array.isArray(series.genres) && series.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {series.genres.map((g: string) => (
                  <Link
                    key={g}
                    href={`/filter?genre=${encodeURIComponent(g)}`}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200 border border-white/5 transition"
                  >
                    {g}
                  </Link>
                ))}
              </div>
            )}

            {/* Quick Action Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={toggleFollow}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 active:scale-95 ${
                  isFollowing
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isFollowing ? 'fill-emerald-400' : ''}`} />
                <span>{isFollowing ? 'Tracking in Library' : '+ Add to Library'}</span>
              </button>

              {/* Personal Rating Stars */}
              <div className="flex items-center gap-1 bg-zinc-900/80 px-3 py-2 rounded-xl border border-white/10">
                <span className="text-[11px] font-bold text-zinc-400 mr-1.5">Score:</span>
                {[2, 4, 6, 8, 10].map((starVal) => (
                  <button
                    key={starVal}
                    onClick={() => handleRatingChange(starVal)}
                    className="p-0.5 hover:scale-125 transition"
                    title={`Rate ${starVal}/10`}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        userRating >= starVal
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-zinc-600 hover:text-zinc-400'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Progress Dashboard */}
        <div className="p-5 sm:p-6 rounded-3xl bg-zinc-900/60 backdrop-blur-xl border border-white/[0.08] shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider text-white">Your Reading Tracker</h2>
                <p className="text-[11px] text-zinc-400">Keep reading records synchronized across devices</p>
              </div>
            </div>

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                syncTracker(progress, e.target.value, isFollowing, userRating);
              }}
              className="bg-zinc-800/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 font-bold transition"
            >
              <option value="reading">Reading / Watching</option>
              <option value="completed">Completed</option>
              <option value="plan_to_read">Plan to Read</option>
              <option value="on_hold">On Hold</option>
              <option value="dropped">Dropped</option>
            </select>
          </div>

          {/* Progress Slider Track */}
          {totalUnits > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-zinc-400">
                <span>{completionPercentage}% complete</span>
                <span className="text-indigo-400">{progress} of {totalUnits} {series.media_type === 'anime' ? 'episodes' : 'chapters'}</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-zinc-800/80 overflow-hidden p-0.5 border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-400 transition-all duration-300 rounded-full"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Stepper Controls */}
          <div className="flex items-center justify-between bg-zinc-950/70 px-4 py-3 rounded-2xl border border-white/5">
            <span className="text-xs font-bold text-zinc-300">
              {series.media_type === 'anime' ? 'Current Episode:' : 'Current Chapter:'}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleProgressChange(progress - 1)}
                disabled={progress <= 0}
                className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-200 flex items-center justify-center transition active:scale-95"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="w-24 text-center">
                <input
                  type="number"
                  value={progress}
                  onChange={(e) => handleProgressChange(parseInt(e.target.value, 10) || 0)}
                  className="w-16 text-center font-black text-sm text-indigo-400 bg-zinc-900 border border-white/10 rounded-lg py-1 focus:outline-none focus:border-indigo-500"
                />
                {totalUnits > 0 && <span className="text-[10px] text-zinc-500 ml-1">/ {totalUnits}</span>}
              </div>

              <button
                onClick={() => handleProgressChange(progress + 1)}
                disabled={isMaxProgress}
                className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition active:scale-95 shadow-md shadow-indigo-600/30"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Synopsis Section */}
        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-white/[0.06] space-y-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400">Synopsis</h2>
          <p className={`text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal ${synopsisExpanded ? '' : 'line-clamp-3'}`}>
            {series.synopsis || 'No official synopsis provided for this title.'}
          </p>
          {series.synopsis && series.synopsis.length > 200 && (
            <button
              onClick={() => setSynopsisExpanded(!synopsisExpanded)}
              className="text-xs font-black text-indigo-400 hover:text-indigo-300 flex items-center gap-1 pt-1"
            >
              <span>{synopsisExpanded ? 'Show Less' : 'Read Full Overview'}</span>
              {synopsisExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>

        {/* Chapter Index Directory (MangaFlow-Style Chapter Navigation) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-black uppercase tracking-wider text-zinc-200">
                Chapter Directory ({directoryCount} Units)
              </h2>
            </div>
            <button
              onClick={() => setChapterSortAsc(!chapterSortAsc)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-900 border border-white/10 text-xs font-bold text-zinc-400 hover:text-white transition"
            >
              <ArrowUpDown className="w-3 h-3" />
              <span>{chapterSortAsc ? 'Oldest First (1 → ...)' : 'Latest First (... → 1)'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-80 overflow-y-auto p-1 pr-2">
            {displayChapters.map((num) => {
              const isRead = num <= progress;
              return (
                <button
                  key={num}
                  onClick={() => handleProgressChange(num)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition text-left ${
                    isRead
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-zinc-900/60 hover:bg-zinc-800 border-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>Ch. {num}</span>
                  {isRead ? (
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <span className="text-[10px] text-zinc-600 font-normal">Mark</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Verified Official Publishers & License Providers */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-200">
              Verified Legal Publishers & Streaming Platforms
            </h2>
          </div>

          {uniqueLinks.length === 0 ? (
            <div className="p-6 rounded-2xl bg-zinc-900/20 border border-dashed border-white/10 text-center">
              <p className="text-xs text-zinc-500">Official license indexing in progress.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {uniqueLinks.map((src: any) => {
                const meta = getPlatformMeta(src.site);
                return (
                  <a
                    key={src.url}
                    href={`/api/track?mediaId=${encodeURIComponent(series.id)}&target=${encodeURIComponent(src.url)}&step=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/60 hover:bg-zinc-850 border border-white/[0.06] hover:border-indigo-500/40 transition group shadow-lg"
                  >
                    <div className="space-y-1">
                      <span className="text-xs font-black text-white group-hover:text-indigo-400 transition block">
                        {meta.label}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border inline-block ${meta.color}`}>
                        {meta.badge}
                      </span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400 transition" />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating Toast */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur-xl border border-white/15 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}

      {/* Report Modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setReportOpen(false)} />
          <div className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-2xl p-5 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-black text-sm text-white">Report Metadata Issue</h3>
              <button onClick={() => setReportOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportSubmitted ? (
              <p className="text-xs text-emerald-400 font-bold py-4 text-center">Thank you. Your report has been submitted for review.</p>
            ) : (
              <form onSubmit={submitReport} className="space-y-3.5 text-xs">
                <div>
                  <label className="text-zinc-400 block mb-1.5 font-bold">Issue Category:</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-zinc-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="broken_link">Broken or Dead Publisher Link</option>
                    <option value="wrong_chapters">Incorrect Chapter/Episode Count</option>
                    <option value="incorrect_info">Outdated Cover or Title Metadata</option>
                    <option value="other">Other Inconsistency</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1.5 font-bold">Details (Optional):</label>
                  <textarea
                    rows={3}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Provide additional context to help us verify..."
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-zinc-200 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 font-black text-white rounded-xl transition shadow-lg shadow-indigo-600/30"
                >
                  Submit Feedback
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
