// app/series/[id]/page.tsx
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { 
  ArrowLeft, ExternalLink, Star, Plus, Minus, Bookmark, 
  Globe, ChevronDown, ChevronUp, Flag, X, CheckCheck, 
  Share2, Layers, Sparkles
} from 'lucide-react';

const PLATFORM_LANGUAGES: Record<string, string> = {
  crunchyroll: 'Official Streaming (Sub/Dub)',
  netflix: 'Official Streaming (Multi)',
  webtoon: 'Official Webtoon (English/Global)',
  'naver webtoon': 'Official Raw (Korean)',
  tapas: 'Official Translation (English)',
  tappytoon: 'Official Translation (English/EU)',
  'royal road': 'Author Original Web Novel',
  webnovel: 'Official Publisher Serialization',
  'manga plus': 'Official Shueisha Simulpub',
  bookwalker: 'Official Digital E-Book (Kadokawa)',
  'j-novel club': 'Official Light Novel Translation',
  'yen press': 'Official Licensed Edition',
};

function getPlatformBadge(siteName: string): string {
  const lower = (siteName || '').toLowerCase();
  for (const [key, lang] of Object.entries(PLATFORM_LANGUAGES)) {
    if (lower.includes(key)) return lang;
  }
  return 'Official Licensed Platform';
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
  const [isEditingInput, setIsEditingInput] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportType, setReportType] = useState('broken_link');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const [, startTransition] = useTransition();

  useEffect(() => {
    async function loadSeriesAndUserData() {
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
          const { data: trackData } = await supabase
            .from('user_tracker')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('media_id', data.id)
            .maybeSingle();

          if (trackData) {
            setProgress(trackData.progress || 0);
            setStatus(trackData.status || 'plan_to_read');
            setIsFollowing(trackData.is_following ?? true);
          }
        } else {
          try {
            const guestLibrary = JSON.parse(localStorage.getItem('omnidex_guest_library') || '[]');
            const local = guestLibrary.find((g: any) => g.id === data.id);
            if (local) {
              setProgress(local.progress || 0);
              setStatus(local.status || 'plan_to_read');
              setIsFollowing(true);
            }
          } catch {}
        }
      }
      setLoading(false);
    }
    loadSeriesAndUserData();
  }, [id]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  const syncGuestStorage = (nextProg: number, nextStatus: string, nextFollow: boolean) => {
    try {
      let guestLibrary = JSON.parse(localStorage.getItem('omnidex_guest_library') || '[]');
      if (nextFollow) {
        const idx = guestLibrary.findIndex((g: any) => g.id === series.id);
        const entry = { id: series.id, progress: nextProg, status: nextStatus };
        if (idx >= 0) guestLibrary[idx] = entry;
        else guestLibrary.push(entry);
      } else {
        guestLibrary = guestLibrary.filter((g: any) => g.id !== series.id);
      }
      localStorage.setItem('omnidex_guest_library', JSON.stringify(guestLibrary));
    } catch {}
  };

  const commitTrackerUpdate = async (nextProg: number, nextStatus: string, nextFollow: boolean) => {
    if (user) {
      await supabase.from('user_tracker').upsert({
        user_id: user.id,
        media_id: series.id,
        progress: nextProg,
        status: nextStatus,
        is_following: nextFollow,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,media_id' });
    } else {
      syncGuestStorage(nextProg, nextStatus, nextFollow);
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
      triggerToast('🎉 Completed!');
    } else if (clamped > 0 && status === 'plan_to_read') {
      nextStatus = 'reading';
      setStatus('reading');
    }

    startTransition(() => {
      commitTrackerUpdate(clamped, nextStatus, isFollowing);
    });
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    startTransition(() => {
      commitTrackerUpdate(progress, newStatus, isFollowing);
    });
  };

  const toggleFollow = () => {
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    triggerToast(nextState ? 'Added to Tracking Library' : 'Removed from Library');
    startTransition(() => {
      commitTrackerUpdate(progress, status, nextState);
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

  return (
    <div className="min-h-screen bg-[#06080d] text-zinc-100 pb-28 selection:bg-indigo-500/30">
      <div className="relative w-full h-56 sm:h-80 overflow-hidden bg-zinc-950 border-b border-white/[0.06]">
        <img
          src={series.banner_url || series.cover_url}
          alt=""
          className="w-full h-full object-cover filter blur-[8px] opacity-25 scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06080d] via-[#06080d]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#06080d]/80 via-transparent to-[#06080d]/80" />

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
                  triggerToast('Link copied to clipboard');
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

      <div className="max-w-4xl mx-auto px-4 sm:px-8 -mt-24 sm:-mt-32 relative z-10 space-y-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="w-32 sm:w-44 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border border-white/10 bg-zinc-900 flex-shrink-0 relative group">
            <img src={series.cover_url || '/placeholder.svg'} alt={series.title_primary} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
              <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">{series.format || series.media_type}</span>
            </div>
          </div>

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
            </div>

            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              {series.title_primary}
            </h1>

            {series.title_secondary && (
              <p className="text-xs font-medium text-zinc-400 truncate">
                {series.title_secondary}
              </p>
            )}

            <div className="flex items-center gap-3 pt-2">
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
            </div>
          </div>
        </div>

        {/* Progress Tracker Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/[0.08] shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-black uppercase tracking-wider text-zinc-200">Reading Progress</h2>
            </div>

            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-zinc-800/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 font-bold transition"
            >
              <option value="reading">Reading / Watching</option>
              <option value="completed">Completed</option>
              <option value="plan_to_read">Plan to Read</option>
              <option value="on_hold">On Hold</option>
              <option value="dropped">Dropped</option>
            </select>
          </div>

          {totalUnits > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold text-zinc-400">
                <span>{completionPercentage}% complete</span>
                <span>{progress} / {totalUnits} units</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-300 rounded-full"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between bg-zinc-950/60 px-4 py-3 rounded-xl border border-white/5">
            <span className="text-xs font-semibold text-zinc-400">
              {series.media_type === 'anime' ? 'Episodes Completed' : 'Chapters Read'}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleProgressChange(progress - 1)}
                disabled={progress <= 0}
                className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-200 flex items-center justify-center transition active:scale-95"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              {isEditingInput ? (
                <input
                  type="number"
                  inputMode="numeric"
                  autoFocus
                  defaultValue={progress}
                  onBlur={(e) => {
                    handleProgressChange(parseInt(e.target.value, 10) || 0);
                    setIsEditingInput(false);
                  }}
                  className="w-16 text-center text-sm font-black text-indigo-400 bg-zinc-900 border border-indigo-500 rounded-lg py-1 focus:outline-none"
                />
              ) : (
                <button
                  onClick={() => setIsEditingInput(true)}
                  className="w-20 text-center font-black text-sm text-indigo-400 hover:text-indigo-300 transition"
                >
                  {progress} {totalUnits > 0 ? `/ ${totalUnits}` : ''}
                </button>
              )}

              <button
                onClick={() => handleProgressChange(progress + 1)}
                disabled={isMaxProgress}
                className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition active:scale-95 shadow-md shadow-indigo-600/30"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Synopsis */}
        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-white/[0.06] space-y-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400">Synopsis</h2>
          <p className={`text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal ${synopsisExpanded ? '' : 'line-clamp-3'}`}>
            {series.synopsis || 'No official synopsis provided for this title.'}
          </p>
          {series.synopsis && series.synopsis.length > 180 && (
            <button
              onClick={() => setSynopsisExpanded(!synopsisExpanded)}
              className="text-xs font-black text-indigo-400 hover:text-indigo-300 flex items-center gap-1 pt-1"
            >
              <span>{synopsisExpanded ? 'Show Less' : 'Read Full Overview'}</span>
              {synopsisExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>

        {/* Verified Legal Publishers */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-300">
              Verified Legal Publishers & Streaming
            </h2>
          </div>

          {uniqueLinks.length === 0 ? (
            <div className="p-6 rounded-2xl bg-zinc-900/20 border border-dashed border-white/10 text-center">
              <p className="text-xs text-zinc-500">Official license indexing in progress.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {uniqueLinks.map((src: any) => (
                <a
                  key={src.url}
                  href={`/api/track?mediaId=${encodeURIComponent(series.id)}&target=${encodeURIComponent(src.url)}&step=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-850 border border-white/[0.06] hover:border-indigo-500/40 transition group"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-zinc-200 group-hover:text-indigo-400 transition block">
                      {src.site}
                    </span>
                    <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-indigo-400/80" />
                      <span>{getPlatformBadge(src.site)}</span>
                    </span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400 transition" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur-xl border border-white/15 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl z-50">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
