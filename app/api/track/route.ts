import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const ALLOWED_PLATFORMS = [
  'crunchyroll.com',
  'netflix.com',
  'webtoons.com',
  'tapas.io',
  'tappytoon.com',
  'bookwalker.jp',
  'kobo.com',
  'royalroad.com',
  'bilibilicomics.com',
  'mangaplus.shueisha.co.jp',
];

function isSafeUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    return ALLOWED_PLATFORMS.some((domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mediaId = searchParams.get('mediaId');
  const targetUrl = searchParams.get('target');
  const progressStep = parseInt(searchParams.get('step') || '1', 10);

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
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      });

      const { data: { user } } = await supabase.auth.getUser();

      if (user && mediaId) {
        await supabase.from('user_tracker').upsert(
          {
            user_id: user.id,
            media_id: mediaId,
            progress: progressStep,
            status: 'watching_reading',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,media_id' }
        );
      }
    }
  } catch (err) {
    console.error('Track error:', err);
  }

  return NextResponse.redirect(targetUrl);
}
