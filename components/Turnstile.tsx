'use client';
import { useEffect, useRef } from 'react';

declare global { interface Window { turnstile?: any; } }

export default function Turnstile({ onToken }: { onToken: (t: string | null) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !ref.current) return;
    let widget: string | undefined;
    const render = () => {
      if (!window.turnstile || !ref.current) return;
      widget = window.turnstile.render(ref.current, {
        sitekey: siteKey, theme: 'dark',
        callback: (t: string) => onToken(t),
        'expired-callback': () => onToken(null),
        'error-callback': () => onToken(null),
      });
    };
    if (window.turnstile) render();
    else {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true; s.onload = render;
      document.head.appendChild(s);
    }
    return () => { if (widget && window.turnstile) window.turnstile.remove(widget); };
  }, [siteKey, onToken]);

  if (!siteKey) return null;
  return <div ref={ref} className="flex justify-center" />;
}
