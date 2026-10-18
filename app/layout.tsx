import './globals.css';
import AppShell from '../components/AppShell';

export const metadata = {
  title: 'Omnidex — Official Media Tracker',
  description: 'Discover and track Asian pop culture media legally.',
  manifest: '/manifest.json',
  themeColor: '#07090e',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#07090e" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen bg-[#07090e] text-slate-100 antialiased font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
