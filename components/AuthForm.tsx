'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import Turnstile from './Turnstile';

export default function AuthForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captcha, setCaptcha] = useState<string | null>(null);
  const captchaRequired = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (captchaRequired && !captcha) { setError('Please complete the check first.'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: window.location.origin, captchaToken: captcha || undefined },
    });
    setLoading(false);
    if (err) {
      setError(err.status === 429 ? 'Too many attempts. Wait a few minutes and try again.' : 'Could not send the email. Check the address and try again.');
      return;
    }
    setSent(true);
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: 'email' });
    setLoading(false);
    if (err) { setError('That code is wrong or expired.'); return; }
    onDone();
  };

  if (sent) {
    return (
      <form onSubmit={verify} className="space-y-3 text-xs">
        <p className="text-emerald-400 font-bold text-sm">Check your email</p>
        <p className="text-zinc-400">Enter the code we sent, or just tap the link in the email.</p>
        <input
          inputMode="numeric" autoComplete="one-time-code" maxLength={8} required
          value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="123456"
          className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-center tracking-[0.4em] text-lg text-zinc-100 focus:outline-none focus:border-indigo-500"
        />
        {error && <p className="text-rose-400" role="alert">{error}</p>}
        <button type="submit" disabled={loading || code.length < 6}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 font-black text-white rounded-xl transition">
          {loading ? 'Checking...' : 'Sign in'}
        </button>
        <button type="button" onClick={() => { setSent(false); setCode(''); setError(''); }}
          className="w-full text-zinc-500 hover:text-zinc-300">Use a different email</button>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} className="space-y-3 text-xs">
      <div>
        <label htmlFor="auth-email" className="text-zinc-400 block mb-1 font-semibold">Email address</label>
        <input
          id="auth-email" type="email" required autoComplete="email" maxLength={254}
          value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="reader@example.com"
          className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
        />
      </div>
      <Turnstile onToken={setCaptcha} />
      {error && <p className="text-rose-400" role="alert">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 font-black text-white rounded-xl transition">
        {loading ? 'Sending...' : 'Email me a sign-in code'}
      </button>
      <p className="text-zinc-500 text-[11px]">No password needed. New here? An account is created automatically.</p>
    </form>
  );
}
