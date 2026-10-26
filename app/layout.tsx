// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import './globals.css';
import AppShell from '../components/AppShell';

export const metadata: Metadata = {
  title: 'Omnidex — Official Media & Series Tracker',
  description: 'Track legal anime, manhwa, manga, and light novels across official streaming and publishing platforms.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Omnidex',
  },
};

export const viewport: Viewport = {
  themeColor: '#06080d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark bg-[#06080d] text-zinc-100 antialiased selection:bg-indigo-500/30">
      <head>
        <link rel="apple-touch-icon" href="/placeholder.svg" />
      </head>
      <body>
        <AppShell>{children}</AppShell>

        {/* Client-side PWA Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(reg) { console.log('Omnidex PWA Active: ', reg.scope); },
                    function(err) { console.log('Omnidex PWA Failed: ', err); }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
