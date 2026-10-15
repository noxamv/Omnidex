import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mediaId = searchParams.get('mediaId');
  const targetUrl = searchParams.get('target');
  const progressStep = parseInt(searchParams.get('step') || '1', 10);

  if (!targetUrl) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

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
  } catch (err) {
    console.error('Track error:', err);
  }

  return NextResponse.redirect(targetUrl);
}
