import { createClient } from '@supabase/supabase-js';

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function db() {
  if (!URL_ || !KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  return createClient(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function fetchJson(url, opts = {}, { retries = 3, timeout = 20000 } = {}) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(timeout) });
      if (res.status === 429 || res.status >= 500) {
        const wait = Number(res.headers.get('retry-after')) * 1000 || 2000 * (i + 1);
        await sleep(Math.min(wait, 30000));
        lastErr = new Error(`HTTP ${res.status}`);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
      await sleep(1000 * (i + 1));
    }
  }
  throw lastErr;
}

export async function fetchText(url, opts = {}, timeout = 20000) {
  const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(timeout) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

export const norm = (s) => (s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '');
export const slugify = (s) => (s || 'series').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80) || 'series';
export const clip = (s, n) => (s && s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s || null);
export const stripHtml = (s) =>
  (s || '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();

export async function readAll(sb, table, columns, filter = (q) => q) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await filter(sb.from(table).select(columns)).range(from, from + 999);
    if (error) throw error;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}

export async function logRun(sb, job, ok, summary) {
  try { await sb.from('bot_runs').insert({ job, ok, summary }); } catch (e) { console.warn('bot_runs log failed', e.message); }
}

export async function runJob(job, fn) {
  const sb = db();
  const started = Date.now();
  try {
    const summary = (await fn(sb)) || {};
    summary.seconds = Math.round((Date.now() - started) / 1000);
    console.log(`[${job}] OK`, JSON.stringify(summary));
    await logRun(sb, job, true, summary);
  } catch (e) {
    console.error(`[${job}] FAILED`, e);
    await logRun(sb, job, false, { error: String(e.message || e).slice(0, 500) });
    process.exitCode = 1;
  }
}

// Rows are grouped by their exact set of columns so a batch can never overwrite values with defaults.
export async function upsertBatches(sb, table, rows, onConflict, size = 200) {
  const groups = new Map();
  for (const r of rows) {
    const sig = Object.keys(r).sort().join('|');
    if (!groups.has(sig)) groups.set(sig, []);
    groups.get(sig).push(r);
  }
  let n = 0;
  for (const list of groups.values()) {
    for (let i = 0; i < list.length; i += size) {
      const chunk = list.slice(i, i + size);
      const { error } = await sb.from(table).upsert(chunk, { onConflict, defaultToNull: false });
      if (error) throw error;
      n += chunk.length;
    }
  }
  return n;
}
