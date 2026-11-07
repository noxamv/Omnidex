// app/series/[id]/page.tsx
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import { coverSrc } from '../../../lib/media';
import Comments from '../../../components/Comments';

import { 
  ArrowLeft, ExternalLink, Star, Plus, Minus, Bookmark, 
  Globe, ChevronDown, ChevronUp, Flag, X, CheckCheck, 
  Share2, Layers, Sparkles, BookOpen, ArrowUpDown, Copy, Check
} from 'lucide-react';

const REGION_BADGES: Record<string, { label: string; style: string }> = {
  KR: { label: '🇰🇷 Korean Raw / License', style: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  JP: { label: '🇯🇵 Japanese Raw / License', style: 'text-rose-400 border-rose-500/30 bg-rose-500/10' },
  CN: { label: '🇨🇳 Chinese Raw / License', style: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  US: { label: '🇺🇸 Official English Edition', style: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10' },
  GLOBAL: { label: '🌐 Global Licensed Stream', style: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' },
};

export default function SeriesDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [series, setSeries] = useState<any>(null);
  const [releaseDates, setReleaseDates] = useState<Record<number, string>>({});
  const [reportError, setReportError] = useState('');
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

  // Share Modal
  const [shareOpen, setShareOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

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

        supabase.from('media_chapters').select('chapter,released_at').eq('media_id', data.id)
          .order('chapter', { ascending: false }).limit(1500)
          .then(({ data: ch }) => {
            const map: Record<number, string> = {};
            (ch || []).forEach((c: any) => { if (c.released_at && Number.isInteger(c.chapter)) map[c.chapter] = c.released_at; });
            setReleaseDates(map);
          });

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

  // Social Share Matrix Link Construction
  const getShareLinks = () => {
    if (typeof window === 'undefined') return [];
    const shareUrl = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(`Track "${series?.title_primary}" on Omnidex!`);

    return [
      { name: 'WhatsApp', color: 'bg-[#25D366]/20 text-[#25D366] border-[#25D366]/30', url: `https://api.whatsapp.com/send?text=${title}%20${shareUrl}` },
      { name: 'Telegram', color: 'bg-[#229ED9]/20 text-[#229ED9] border-[#229ED9]/30', url: `https://t.me/share/url?url=${shareUrl}&text=${title}` },
      { name: 'X / Twitter', color: 'bg-white/10 text-white border-white/20', url: `https://twitter.com/intent/tweet?text=${title}&url=${shareUrl}` },
      { name: 'Reddit', color: 'bg-[#FF4500]/20 text-[#FF4500] border-[#FF4500]/30', url: `https://www.reddit.com/submit?url=${shareUrl}&title=${title}` },
      { name: 'Facebook', color: 'bg-[#1877F2]/20 text-[#1877F2] border-[#1877F2]/30', url: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}` },
    ];
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportError('');
    if (!user) { setReportError('Please sign in to send a report.'); return; }
    const { error } = await supabase.from('media_reports').insert({
      media_id: series.id,
      user_id: user.id,
      issue_type: reportType,
      details: reportDetails.slice(0, 1000),
    });
    if (error) { setReportError(error.message.includes('Too many') ? 'Too many reports. Try again later.' : 'Could not send the report.'); return; }
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
  const uniqueLinks = Array.from(new Map(rawLinks.filter((l) => l?.url).map((l) => [l.url, l])).values());
  const totalUnits = series.total_units || 0;
  const isMaxProgress = totalUnits > 0 && progress >= totalUnits;
  const completionPercentage = totalUnits > 0 ? Math.min(100, Math.round((progress / totalUnits) * 100)) : 0;

  const latestKnown = Math.floor(series.latest_chapter || 0);
  const directoryCount = Math.max(totalUnits, latestKnown) > 0 ? Math.max(totalUnits, latestKnown) : Math.max(progress + 15, 30);
  const chapterNumbers = Array.from({ length: directoryCount }, (_, i) => i + 1);
  const displayChapters = chapterSortAsc ? chapterNumbers : [...chapterNumbers].reverse();

  return (
    <div className="min-h-screen bg-[#06080d] text-zinc-100 pb-28 selection:bg-indigo-500/30">
      {/* Immersive Hero Header */}
      <div className="relative w-full h-64 sm:h-96 overflow-hidden bg-zinc-950 border-b border-white/[0.06]">
        <img
          src={coverSrc(series.banner_url || series.cover_url)}
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
              onClick={() => setShareOpen(true)}
              className="p-2.5 rounded-xl bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/10 text-zinc-300 hover:text-white transition"
              title="Share Series"
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
            <img src={coverSrc(series.cover_url)} alt={series.title_primary} className="w-full h-full object-cover" />
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

            {/* Global Genre Matrix Tags */}
            {Array.isArray(series.genres) && series.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {series.genres.map((g: string) => (
                  <Link
                    key={g}
                    href={`/filter?genre=${encodeURIComponent(g)}`}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-indigo-300 border border-white/5 transition"
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

              {/* 10-Star Rating Bar */}
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
          {totalUnits
