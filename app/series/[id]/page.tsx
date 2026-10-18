'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { 
  ArrowLeft, ExternalLink, Star, Plus, Minus, Bookmark, 
  Globe, ChevronDown, ChevronUp, Flag, X 
} from 'lucide-react';

const PLATFORM_LANGUAGES: Record<string, string> = {
  crunchyroll: 'English Sub/Dub (Multi)',
  netflix: 'Multi-Language (Sub/Dub)',
  webtoon: 'English, Korean, French, Spanish',
  'naver webtoon': 'Korean (Official Raw)',
  tapas: 'English',
  tappytoon: 'English, French, German',
  'royal road': 'English (Original Web Novel)',
  webnovel: 'English & Global Multi',
  wattpad: 'English & Global',
  'manga plus': 'English, Spanish, French',
  bookwalker: 'English & Japanese',
  'j-novel club': 'English (Light Novel)',
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
  
  const [user, setUser] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string>('plan_to_read');
  const [showNumberInput, setShowNumberInput] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [stepIncrement, setStepIncrement] = useState(1);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportType, setReportType] = useState('broken_link');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  useEffect(() => {
    // Read user step preference
    const savedStep = localStorage.getItem('omnidex_step_increment');
    if (savedStep) setStepIncrement(parseInt(savedStep, 10) || 1);

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
            .single();

          if (trackData) {
            setProgress(trackData.progress || 0);
            setStatus(trackData.status || 'plan_to_read');
            setIsFollowing(trackData.is_following ?? true);
          }
        } else {
          // Robust LocalStorage Guest Library Check
          try {
            const guestLibrary = JSON.parse(localStorage.getItem('omnidex_guest_library') || '[]');
            const local = guestLibrary.find((g: any) => g.id === data.id);
            if (local) {
              setProgress(local.progress || 0);
              setStatus(local.status || 'plan_to_read');
              setIsFollowing(true);
            }
          } catch (e) {}
        }
      }
      setLoading(false);
    }
    loadSeriesAndUserData();
  }, [id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const syncGuestStorage = (nextProgress: number, nextStatus: string, nextFollow: boolean) => {
    try {
      let guestLibrary = JSON.parse(localStorage.getItem('omnidex_guest_library') || '[]');
      if (nextFollow) {
        const existingIdx = guestLibrary.findIndex((g: any) => g.id === series.id);
        const entry = { id: series.id, progress: nextProgress, status: nextStatus };
        if (existingIdx >= 0) guestLibrary[existingIdx] = entry;
        else guestLibrary.push(entry);
      } else {
        guestLibrary = guestLibrary.filter((g: any) => g.id !== series.id);
      }
      localStorage.setItem('omnidex_guest_library', JSON.stringify(guestLibrary));
    } catch (e) {}
  };

  const handleProgressChange = async (newVal: number) => {
    const ceiling = series?.total_units && series.total_units > 0 ? series.total_units : 99999;
    const finalVal = Math.min(Math.max(0, newVal), ceiling);
    setProgress(finalVal);

    if (user) {
      await supabase.from('user_tracker').upsert({
        user_id: user.id,
        media_id: series.id,
        progress: finalVal,
        status,
        is_following: isFollowing,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,media_id' });
    } else {
      syncGuestStorage(finalVal, status, isFollowing);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);

    if (user) {
      await supabase.from('user_tracker').upsert({
        user_id: user.id,
        media_id: series.id,
        progress,
        status: newStatus,
        is_following: isFollowing,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,media_id' });
    } else {
      syncGuestStorage(progress, newStatus, isFollowing);
    }
  };

  const toggleFollow = async () => {
    const nextState = !isFollowing;
    setIsFollowing(nextState);

    if (user) {
      await supabase.from('user_tracker').upsert({
        user_id: user.id,
        media_id: series.id,
        progress,
        status,
        is_following: nextState,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,media_id' });
    } else {
      syncGuestStorage(progress, status, nextState);
    }

    showToast(nextState ? 'Added to Library' : 'Removed from Library');
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
    }, 2000);
  };

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-24 text-center text-slate-500 text-xs">Loading series catalog...</div>;
  }

  if (!series) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-3">
        <p className="text-slate-400 text-sm">Series not found.</p>
        <button onClick={() => router.push('/')} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
          Return Home
        </button>
      </div>
    );
  }

  // Deduplicate official links by normalized URL and site name
  const rawLinks = (series.official_links as any[]) || [];
  const uniqueMap = new Map();
  rawLinks.forEach((src) => {
    if (src && src.url && !uniqueMap.has(src.url)) {
      uniqueMap.set(src.url, src);
    }
  });
  const officialLinks = Array.from(uniqueMap.values());
  const totalUnits = series.total_units || 0;

  return (
    <div className="min-h-screen bg-[#07090e] pb-20">
      {/* Banner */}
      <div className="relative w-full h-44 sm:h-64 overflow-hidden bg-slate-900 border-b border-slate-800">
        <img
          src={series.banner_url || series.cover_url}
          alt=""
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

      <div className="max-w-3xl mx-auto px-4 -mt-20 relative z-10 space-y-4">
        {/* Core Info */}
        <div className="flex gap-4 items-start">
          <div className="w-28 sm:w-36 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-900 flex-shrink-0">
            <img src={series.cover_url || '/placeholder.svg'} alt="" className="w-full h-full object-cover" />
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

            {/* Follow & Report Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={toggleFollow}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  isFollowing
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-indigo-600 text-white hover:bg-indigo-500'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isFollowing ? 'Following' : '+ Follow'}</span>
              </button>

              <button
                onClick={() => setReportOpen(true)}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                title="Report issue"
              >
                <Flag className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Truncated Synopsis */}
        <div className="bg-[#0e121b] p-4 rounded-xl border border-slate-800 space-y-2">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Synopsis</h2>
          <p className={`text-xs text-slate-300 leading-relaxed ${synopsisExpanded ? '' : 'line-clamp-3'}`}>
            {series.synopsis}
          </p>
          <button
            onClick={() => setSynopsisExpanded(!synopsisExpanded)}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 pt-0.5"
          >
            <span>{synopsisExpanded ? 'Show Less' : 'Read More'}</span>
            {synopsisExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Progress Tracker */}
        <div className="bg-[#0e121b] p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">Track Progress</h2>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-[#111622] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
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
                onClick={() => handleProgressChange(progress - stepIncrement)}
                className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              {showNumberInput ? (
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoFocus
                  defaultValue={progress}
                  onBlur={(e) => {
                    handleProgressChange(parseInt(e.target.value, 10) || 0);
                    setShowNumberInput(false);
                  }}
                  className="w-14 text-center text-sm font-black text-indigo-400 bg-slate-900 border border-indigo-500 rounded px-1"
                />
              ) : (
                <button
                  onClick={() => setShowNumberInput(true)}
                  className="w-14 text-center text-sm font-black text-indigo-400 hover:underline"
                >
                  {progress} {totalUnits > 0 ? `/ ${totalUnits}` : ''}
                </button>
              )}

              <button
                onClick={() => handleProgressChange(progress + stepIncrement)}
                className="p-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Deduplicated Official Sources with Language Badges */}
        <div className="space-y-2">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Official Sources & Translations
          </h2>

          <div className="space-y-1.5">
            {officialLinks.map((src: any) => {
              const langBadge = getPlatformLanguage(src.site);
              return (
                <a
                  key={src.url}
                  href={`/api/track?mediaId=${encodeURIComponent(series.id)}&target=${encodeURIComponent(src.url)}&step=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-[#0e121b] hover:bg-[#131a29] border border-slate-800/80 hover:border-indigo-500/50 transition group"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition block">
                      {src.site}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Globe className="w-2.5 h-2.5 text-indigo-400" />
                      <span>{langBadge}</span>
                    </span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition" />
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xl z-50 animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* Report Modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setReportOpen(false)} />
          <div className="relative w-full max-w-sm bg-[#0e121b] border border-slate-800 rounded-2xl p-5 shadow-2xl z-10 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="font-bold text-sm text-white">Report Series Issue</h3>
              <button onClick={() => setReportOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportSubmitted ? (
              <p className="text-xs text-emerald-400 font-bold py-3 text-center">Report submitted! Thank you.</p>
            ) : (
              <form onSubmit={submitReport} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Issue Type:</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full bg-[#111622] border border-slate-700 rounded-lg p-2 text-slate-200"
                  >
                    <option value="broken_link">Broken / Dead Source Link</option>
                    <option value="wrong_chapters">Incorrect Chapter / Episode Count</option>
                    <option value="incorrect_info">Wrong Cover / Title / Synopsis</option>
                    <option value="other">Other Issue</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Details (Optional):</label>
                  <textarea
                    rows={3}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Describe what needs to be fixed..."
                    className="w-full bg-[#111622] border border-slate-700 rounded-lg p-2 text-slate-200"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 font-bold text-white rounded-lg transition"
                >
                  Submit Report
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
