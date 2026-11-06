import type { Metadata } from 'next';
import { publicClient } from '../../../lib/supabase';
import { rawCover } from '../../../lib/media';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const id = decodeURIComponent(params.id);
  try {
    const { data } = await publicClient()
      .from('media_catalog')
      .select('title_primary, synopsis, cover_url, media_type')
      .eq('id', id)
      .maybeSingle();
    if (!data) return { title: 'Series not found' };
    const desc = (data.synopsis || `Track ${data.title_primary} on Omnidex.`).replace(/\s+/g, ' ').slice(0, 160);
    const img = rawCover(data.cover_url);
    return {
      title: data.title_primary,
      description: desc,
      openGraph: { title: data.title_primary, description: desc, images: img ? [img] : undefined },
      twitter: { card: img ? 'summary_large_image' : 'summary' },
    };
  } catch {
    return { title: 'Series' };
  }
}

export default function SeriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
