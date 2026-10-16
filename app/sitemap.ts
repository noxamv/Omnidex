import { MetadataRoute } from 'next';
import { supabase } from '../lib/supabase';

export const revalidate = 43200;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://omni-index-eight.vercel.app';

  let entries: MetadataRoute.Sitemap = [];

  try {
    const { data: media } = await supabase
      .from('media_catalog')
      .select('slug, updated_at')
      .limit(500);

    if (media && media.length > 0) {
      entries = media.map((m) => ({
        url: `${baseUrl}/?search=${encodeURIComponent(m.slug)}`,
        lastModified: new Date(m.updated_at || Date.now()),
        changeFrequency: 'hourly' as const,
        priority: 0.8,
      }));
    }
  } catch (err) {
    console.warn('Sitemap generation failed to query media catalog:', err);
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1.0,
    },
    ...entries,
  ];
}
