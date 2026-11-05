import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Browser client: keeps the session in cookies so server routes can see the user.
export const supabase = createBrowserClient(url, anon);

// Plain read-only client for server code (sitemap, metadata).
export const publicClient = () =>
  createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
