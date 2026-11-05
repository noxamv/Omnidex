const PROXY_HOSTS = [
  'uploads.mangadex.org', 'media.kitsu.io', 'media.kitsu.app', 'kitsu.io',
  's4.anilist.co', 'upload.wikimedia.org', 'm.media-amazon.com', 'cdn.myanimelist.net',
];

export function rawCover(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('/api/proxy')) {
    try {
      return decodeURIComponent(new URL(url, 'http://x').searchParams.get('url') || '') || null;
    } catch { return null; }
  }
  return url;
}

export function coverSrc(url?: string | null): string {
  const raw = rawCover(url);
  if (!raw || !/^https:\/\//.test(raw)) return '/placeholder.svg';
  try {
    const host = new URL(raw).hostname;
    const ok = PROXY_HOSTS.some((h) => host === h || host.endsWith('.' + h));
    return ok ? `/api/proxy?url=${encodeURIComponent(raw)}` : '/placeholder.svg';
  } catch { return '/placeholder.svg'; }
}
