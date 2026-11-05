import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const ALLOWED = [
  'uploads.mangadex.org', 'media.kitsu.io', 'media.kitsu.app', 'kitsu.io',
  's4.anilist.co', 'upload.wikimedia.org', 'm.media-amazon.com', 'cdn.myanimelist.net',
];
const MAX_BYTES = 3 * 1024 * 1024;
const hostOk = (h: string) => ALLOWED.some((d) => h === d || h.endsWith('.' + d));

export async function GET(req: NextRequest) {
  const target = new URL(req.url).searchParams.get('url');
  if (!target) return new NextResponse('Missing url', { status: 400 });

  let u: URL;
  try { u = new URL(target); } catch { return new NextResponse('Bad url', { status: 400 }); }
  if (u.protocol !== 'https:' || !hostOk(u.hostname)) {
    return new NextResponse('Host not allowed', { status: 403 });
  }

  try {
    const res = await fetch(u.toString(), {
      redirect: 'manual',
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'OmnidexImageProxy/1.0', Accept: 'image/*' },
    });
    if (res.status >= 300 && res.status < 400) return new NextResponse('Redirect blocked', { status: 502 });
    if (!res.ok) return new NextResponse('Upstream error', { status: res.status === 404 ? 404 : 502 });

    const type = res.headers.get('content-type') || '';
    if (!type.startsWith('image/') || type.includes('svg')) return new NextResponse('Not an image', { status: 415 });

    const len = Number(res.headers.get('content-length') || 0);
    if (len > MAX_BYTES) return new NextResponse('Too large', { status: 413 });
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) return new NextResponse('Too large', { status: 413 });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': type,
        'Cache-Control': 'public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new NextResponse('Proxy error', { status: 502 });
  }
}
