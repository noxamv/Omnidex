import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '../components/Header';

export const metadata: Metadata = {
  title: 'Omnidex — Official Asian Media Tracker',
  description: 'Track and discover Anime, Manga, Manhwa, and Light Novels legally.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#0a0d14',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#07090e] text-slate-100 selection:bg-indigo-600 antialiased font-sans">
        {/* Fixed Non-Shifting Top Bar */}
        <Header />

        {/* Content */}
        <main className="pb-16">{children}</main>
      </body>
    </html>
  );
}
