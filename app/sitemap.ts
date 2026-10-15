import { MetadataRoute } from 'next';
import { supabase } from '../lib/supabase';

export const revalidate = 43200;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://omni-index-eight.vercel.app';

  const { data: media } = await supabase
    .from('media_catalog')
    .select('slug, updated_at');

  const entries = (media || []).map((m) => ({
    url: `${baseUrl}/?search=${m.slug}`,
    lastModified: new Date(m.updated_at || Date.now()),
    changeFrequency: 'hourly' as const,
    priority: 0.8,
  }));

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
