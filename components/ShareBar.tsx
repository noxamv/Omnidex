'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

export default function ShareBar({
  title,
  slug,
}: {
  title: string;
  slug: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/?search=${slug}` : '';

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out ${title} on Omnidex`,
          text: `Track official releases for ${title} on Omnidex`,
          url: url,
        });
        return;
      } catch (err) {
        // Fallback to clipboard if user cancels native share dialog
      }
    }

    if (url) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="p-1.5 rounded-md bg-slate-800/70 hover:bg-slate-700 text-slate-400 hover:text-white transition flex items-center gap-1 text-xs"
      title="Share title"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
    </button>
  );
}
