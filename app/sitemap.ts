import { MetadataRoute } from 'next';
import { publicClient } from '../lib/supabase';

export const revalidate = 43200;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const pages = ['', '/trending', '/popular', '/latest', '/news', '/filter'].map((p) => ({
    url: `${base}${p}`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: p === '' ? 1 : 0.7,
  }));

  let series: MetadataRoute.Sitemap = [];
  try {
    const { data } = await publicClient()
      .from('media_catalog')
      .select('id, updated_at')
      .order('popularity', { ascending: false })
      .limit(5000);
    series = (data || []).map((m) => ({
      url: `${base}/series/${encodeURIComponent(m.id)}`,
      lastModified: new Date(m.updated_at || Date.now()),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));
  } catch (e) { console.warn('sitemap query failed', e); }
  return [...pages, ...series];
}
.
