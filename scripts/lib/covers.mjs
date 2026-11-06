import { fetchJson, norm, sleep } from './common.mjs';

const UA = { 'User-Agent': 'Omnidex-Bot/1.0 (+github actions)' };

export function unwrapProxy(url) {
  if (!url) return null;
  if (url.startsWith('/api/proxy')) {
    try { return decodeURIComponent(new URL(url, 'http://x').searchParams.get('url') || '') || null; } catch { return null; }
  }
  return url;
}

export const isHttps = (u) => /^https:\/\/[^\s]+$/i.test(u || '');

// true = image loads, false = definitely broken, null = could not tell
export async function checkImage(url) {
  if (!isHttps(url)) return false;
  try {
    let res = await fetch(url, { method: 'HEAD', headers: UA, redirect: 'follow', signal: AbortSignal.timeout(10000) });
    if (res.status === 405 || res.status === 403) {
      res = await fetch(url, { headers: { ...UA, Range: 'bytes=0-1023' }, redirect: 'follow', signal: AbortSignal.timeout(10000) });
    }
    if (res.status === 404 || res.status === 410) return false;
    if (!res.ok && res.status !== 206) return null;
    const type = res.headers.get('content-type') || '';
    return type.startsWith('image/') ? true : false;
  } catch { return null; }
}

// 404/410 = dead link. Sites that block bots (403/429) count as "unknown", not dead.
export async function linkIsDead(url) {
  if (!/^https?:\/\//i.test(url || '')) return true;
  try {
    const res = await fetch(url, { method: 'HEAD', headers: UA, redirect: 'follow', signal: AbortSignal.timeout(10000) });
    return res.status === 404 || res.status === 410;
  } catch (e) {
    return /ENOTFOUND|getaddrinfo/i.test(String(e.cause?.code || e.message));
  }
}

const AL_BY_ID = `query($id:Int){ Media(id:$id){ coverImage{large} } }`;
const AL_SEARCH = `query($s:String,$t:MediaType){ Media(search:$s,type:$t,isAdult:false,sort:SEARCH_MATCH){ id title{english romaji} coverImage{large} } }`;

async function anilist(query, variables) {
  const j = await fetchJson('https://graphql.anilist.co', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables }),
  }, { retries: 2 });
  return j.data?.Media || null;
}

export async function findReplacementCover(row) {
  try {
    if (row.id.startsWith('md-')) {
      const j = await fetchJson(`https://api.mangadex.org/manga/${row.id.slice(3)}?includes[]=cover_art`, { headers: UA }, { retries: 1 });
      const file = j.data?.relationships?.find((r) => r.type === 'cover_art')?.attributes?.fileName;
      if (file) {
        const url = `https://uploads.mangadex.org/covers/${row.id.slice(3)}/${file}.512.jpg`;
        if (await checkImage(url)) return { url };
      }
    }
    if (row.id.startsWith('kt-')) {
      const kind = row.media_type === 'anime' ? 'anime' : 'manga';
      const j = await fetchJson(`https://kitsu.io/api/edge/${kind}/${row.id.slice(3)}`, { headers: { Accept: 'application/vnd.api+json' } }, { retries: 1 });
      const url = j.data?.attributes?.posterImage?.large;
      if (url && (await checkImage(url))) return { url };
    }
    if (row.al_id) {
      const m = await anilist(AL_BY_ID, { id: row.al_id });
      if (m?.coverImage?.large && (await checkImage(m.coverImage.large))) return { url: m.coverImage.large };
    }
    const m = await anilist(AL_SEARCH, { s: row.title_primary, t: row.media_type === 'anime' ? 'ANIME' : 'MANGA' });
    await sleep(700);
    const names = [m?.title?.english, m?.title?.romaji].map(norm);
    if (m?.coverImage?.large && names.includes(norm(row.title_primary)) && (await checkImage(m.coverImage.large))) {
      return { url: m.coverImage.large, al_id: m.id };
    }
  } catch { /* fall through */ }
  return null;
}

export async function healCover(row) {
  const today = new Date().toISOString().slice(0, 10);
  const raw = unwrapProxy(row.cover_url);
  const status = raw ? await checkImage(raw) : false;

  if (status === true) {
    return { cover_url: raw, cover_ok: true, cover_checked_at: today, changed: raw !== row.cover_url ? 'normalized' : 'ok' };
  }
  if (status === null) {
    return { cover_url: raw || row.cover_url, cover_checked_at: today, changed: 'unknown' };
  }
  const found = await findReplacementCover(row);
  if (found) return { cover_url: found.url, cover_ok: true, cover_checked_at: today, ...(found.al_id ? { al_id: found.al_id } : {}), changed: 'replaced' };
  return { cover_url: null, cover_ok: false, cover_checked_at: today, changed: 'missing' };
}
