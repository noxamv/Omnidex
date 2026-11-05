import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/library', '/profile', '/settings', '/notifications', '/import-export'] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
