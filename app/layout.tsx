import type { Metadata, Viewport } from 'next';
import './globals.css';
import AppShell from '../components/AppShell';
import PwaRegister from '../components/PwaRegister';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Omnidex - Anime, Manga, Manhwa & Novel Tracker', template: '%s | Omnidex' },
  description: 'Track anime, manga, manhwa, manhua and novels. Latest chapters, episodes and news in one place.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Omnidex' },
  openGraph: { type: 'website', siteName: 'Omnidex', title: 'Omnidex', description: 'Track anime, manga, manhwa, manhua and novels.' },
  twitter: { card: 'summary' },
};

export const viewport: Viewport = {
  themeColor: '#06080d',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark bg-[#06080d] text-zinc-100 antialiased selection:bg-indigo-500/30">
      <body>
        <AppShell>{children}</AppShell>
        <PwaRegister />
      </body>
    </html>
  );
}
.
