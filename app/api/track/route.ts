import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const ALLOWED_PLATFORMS = [
  'royalroad.com', 'webnovel.com', 'wattpad.com', 'scribblehub.com', 'j-novel.club',
  'yenpress.com', 'bookwalker.jp', 'global.bookwalker.jp', 'kobo.com', 'amazon.com',
  'webtoons.com', 'tapas.io', 'tappytoon.com', 'lezhinus.com', 'toomics.com', 'pocketcomics.com',
  'mangaplus.shueisha.co.jp', 'viz.com', 'kodansha.us', 'comikey.com', 'kmanga.kodansha.net',
  'inkr.com', 'bilibilicomics.com', 'bilibili.tv',
  'crunchyroll.com', 'netflix.com', 'hidive.com', 'disneyplus.com', 'hulu.com',
  'primevideo.com', 'youtube.com',
];

function isSafeUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    return ALLOWED_PLATFORMS.some(
      (d) => parsed.hostname === d || parsed.hostname.endsWith(`.${d}`)
    );
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mediaId = (searchParams.get('mediaId') || '').slice(0, 80);
  const targetUrl = searchParams.get('target');
  const progressStep = Math.min(parseInt(searchParams.get('step') || '1', 10) || 1, 100000);

  if (!targetUrl || !isSafeUrl(targetUrl)) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  try {
    const cookieStore = cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() { /* read-only here */ },
        },
      });

      const { data: { user } } = await supabase.auth.getUser();

      if (user && mediaId) {
        const { data: existing } = await supabase
          .from('user_tracker').select('progress')
          .eq('user_id', user.id).eq('media_id', mediaId).maybeSingle();
        if (!existing) {
          await supabase.from('user_tracker').insert({
            user_id: user.id, media_id: mediaId, progress: Math.max(progressStep, 0),
            status: 'reading', is_following: true,
          });
        } else if (progressStep > (existing.progress || 0)) {
          await supabase.from('user_tracker').update({
            progress: progressStep, updated_at: new Date().toISOString(),
          }).eq('user_id', user.id).eq('media_id', mediaId);
        }
      }
    }
  } catch (err) {
    console.error('Track error:', err);
  }

  return NextResponse.redirect(targetUrl);
}
