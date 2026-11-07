import { runJob, fetchJson, sleep, norm, upsertBatches } from './lib/common.mjs';

const UA = { 'User-Agent': 'Omnidex-Bot/1.0 (tracker; +github actions)' };
const MU = 'https://api.mangaupdates.com/v1';
const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
const maxNum = (s) => {
  const n = String(s ?? '').match(/\d+(?:\.\d+)?/g);
  return n ? Math.max(...n.map(Number)) : NaN;
};

async function animeEpisodes(sb, summary) {
  const now = Math.floor(Date.now() / 1000);
  const q = `query($page:Int,$since:Int,$until:Int){ Page(page:$page,perPage:50){ pageInfo{hasNextPage}
    airingSchedules(airingAt_greater:$since, airingAt_lesser:$until, sort:TIME_DESC){ mediaId episode airingAt } } }`;
  const seen = new Map();
  for (let page = 1; page <= 6; page++) {
    const j = await fetchJson('https://graphql.anilist.co', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q, variables: { page, since: now - 6 * 3600, until: now } }),
    });
    for (const s of j.data?.Page?.airingSchedules || []) {
      const cur = seen.get(s.mediaId);
      if (!cur || s.episode > cur.episode) seen.set(s.mediaId, s);
    }
    if (!j.data?.Page?.pageInfo?.hasNextPage) break;
    await sleep(1200);
  }
  const ids = [...seen.keys()];
  let updated = 0;
  for (let i = 0; i < ids.length; i += 100) {
    const { data: rows } = await sb.from('media_catalog').select('id,al_id,latest_chapter,official_latest').in('al_id', ids.slice(i, i + 100));
    for (const r of rows || []) {
      const s = seen.get(r.al_id);
      if (!s) continue;
      const day = new Date(s.airingAt * 1000).toISOString().slice(0, 10);
      const patch = {};
      if ((r.latest_chapter || 0) < s.episode) Object.assign(patch, { latest_chapter: s.episode, latest_chapter_at: day, updated_at: new Date().toISOString() });
      if ((r.official_latest || 0) < s.episode) Object.assign(patch, { official_latest: s.episode, official_latest_at: day });
      if (Object.keys(patch).length) { await sb.from('media_catalog').update(patch).eq('id', r.id); updated++; }
    }
  }
  summary.animeUpdated = updated;
}

async function mangadexLatest(sb, summary) {
  const latest = new Map();
  for (let p = 0; p < 8; p++) {
    const url = 'https://api.mangadex.org/chapter?limit=100&offset=' + p * 100 +
      '&translatedLanguage[]=en&order[publishAt]=desc&includes[]=manga&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica';
    const j = await fetchJson(url, { headers: UA });
    for (const c of j.data || []) {
      const mangaId = c.relationships?.find((r) => r.type === 'manga')?.id;
      const num = parseFloat(c.attributes?.chapter);
      if (!mangaId || Number.isNaN(num)) continue;
      const at = (c.attributes.publishAt || '').slice(0, 10);
      const cur = latest.get(mangaId) || { num: -1, at: '', off: -1, offAt: '' };
      if (num > cur.num) { cur.num = num; cur.at = at; }
      if (c.attributes.externalUrl && num > cur.off) { cur.off = num; cur.offAt = at; }
      latest.set(mangaId, cur);
    }
    await sleep(400);
  }
  const ids = [...latest.keys()].map((i) => `md-${i}`);
  let updated = 0;
  for (let i = 0; i < ids.length; i += 100) {
    const { data: rows } = await sb.from('media_catalog').select('id,latest_chapter,official_latest').in('id', ids.slice(i, i + 100));
    for (const r of rows || []) {
      const l = latest.get(r.id.slice(3));
      const patch = {};
      if (l.num > (r.latest_chapter || 0)) Object.assign(patch, { latest_chapter: l.num, latest_chapter_at: l.at || null, updated_at: new Date().toISOString() });
      if (l.off > (r.official_latest || 0)) Object.assign(patch, { official_latest: l.off, official_latest_at: l.offAt || null });
      if (Object.keys(patch).length) { await sb.from('media_catalog').update(patch).eq('id', r.id); updated++; }
    }
  }
  summary.mangadexUpdated = updated;
}

async function muRecent(sb, summary) {
  const best = new Map();
  let parsed = 0, sample = null;
  for (let page = 1; page <= 10; page++) {
    let j;
    try {
      j = await fetchJson(`${MU}/releases/days?include_metadata=true&page=${page}&perpage=100&per_page=100`, { headers: { ...UA, Accept: 'application/json' } }, { retries: 1 });
    } catch (e) { if (page === 1) throw e; break; }
    const items = j.results || [];
    if (!items.length) break;
    sample ||= Object.keys(items[0] || {}).concat(Object.keys(items[0]?.record || {}));
    for (const it of items) {
      const rec = it.record || it;
      const sid = it.metadata?.series?.series_id ?? rec.series_id;
      const ch = maxNum(rec.chapter);
      if (!sid || Number.isNaN(ch)) continue;
      const date = String(rec.release_date || '').slice(0, 10);
      const cur = best.get(sid);
      if (!cur || ch > cur.ch) best.set(sid, { ch, date });
      parsed++;
    }
    await sleep(600);
  }
  if (!parsed) { summary.muRecentNote = 'nothing parsed, keys: ' + JSON.stringify(sample); return; }
  const ids = [...best.keys()];
  let updated = 0;
  for (let i = 0; i < ids.length; i += 100) {
    const { data: rows } = await sb.from('media_catalog').select('id,mu_id,latest_chapter').in('mu_id', ids.slice(i, i + 100));
    for (const r of rows || []) {
      const b = best.get(Number(r.mu_id)) || best.get(String(r.mu_id));
      if (!b || b.ch <= (r.latest_chapter || 0)) continue;
      await sb.from('media_catalog').update({
        latest_chapter: b.ch, latest_chapter_at: b.date || today(), updated_at: new Date().toISOString(),
      }).eq('id', r.id);
      updated++;
    }
  }
  summary.muParsed = parsed; summary.muUpdated = updated;
}

const MU_TYPE = { manga: 'manga', manhwa: 'manhwa', manhua: 'manhua', novel: 'novel' };

async function muMapSeries(sb, summary) {
  const { data: rows } = await sb.from('media_catalog').select('id,title_primary,media_type')
    .is('mu_id', null).eq('status', 'releasing').in('media_type', Object.keys(MU_TYPE))
    .or(`mu_checked_at.is.null,mu_checked_at.lt.${daysAgo(30)}`)
    .order('popularity', { ascending: false }).limit(30);
  let mapped = 0;
  for (const r of rows || []) {
    let id = null;
    try {
      const j = await fetchJson(`${MU}/series/search`, {
        method: 'POST', headers: { ...UA, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ search: r.title_primary, perpage: 6, per_page: 6 }),
      }, { retries: 1 });
      for (const hit of j.results || []) {
        const rec = hit.record || hit;
        const type = String(rec.type || '').toLowerCase();
        const typeOk = !type || type.includes(MU_TYPE[r.media_type]) || (r.media_type === 'manga' && !/manhwa|manhua|novel/.test(type));
        const titles = [rec.title, hit.hit_title].map(norm);
        if (typeOk && titles.includes(norm(r.title_primary)) && rec.series_id) { id = rec.series_id; break; }
      }
    } catch { /* try again in 30 days */ }
    await sb.from('media_catalog').update({ ...(id ? { mu_id: id } : {}), mu_checked_at: today() }).eq('id', r.id);
    if (id) mapped++;
    await sleep(900);
  }
  summary.muMapped = mapped;
}

async function muBaseline(sb, summary) {
  const { data: rows } = await sb.from('media_catalog').select('id,mu_id')
    .not('mu_id', 'is', null).is('latest_chapter', null)
    .or(`mu_checked_at.is.null,mu_checked_at.lt.${daysAgo(7)}`).limit(30);
  let filled = 0;
  for (const r of rows || []) {
    let ch = NaN, at = null;
    try {
      const j = await fetchJson(`${MU}/series/${r.mu_id}`, { headers: { ...UA, Accept: 'application/json' } }, { retries: 1 });
      ch = Number(j.latest_chapter);
      if (Number.isNaN(ch)) ch = maxNum(String(j.status || '').match(/(\d+(?:\.\d+)?)\s*chapters?/i)?.[1]);
      at = String(j.last_updated?.as_rfc3339 || '').slice(0, 10) || null;
    } catch { /* retry in 7 days */ }
    const patch = { mu_checked_at: today() };
    if (!Number.isNaN(ch) && ch > 0) { patch.latest_chapter = ch; patch.latest_chapter_at = at; filled++; }
    await sb.from('media_catalog').update(patch).eq('id', r.id);
    await sleep(900);
  }
  summary.muBaseline = filled;
}

async function followedFullLists(sb, summary) {
  const { data: tracked } = await sb.from('user_tracker').select('media_id').eq('is_following', true).like('media_id', 'md-%').limit(2000);
  const ids = [...new Set((tracked || []).map((t) => t.media_id))];
  if (!ids.length) { summary.fullLists = 0; return; }
  const { data: rows } = await sb.from('media_catalog').select('id,chapters_synced_at').in('id', ids.slice(0, 500))
    .order('chapters_synced_at', { ascending: true, nullsFirst: true }).limit(25);
  let done = 0;
  for (const r of rows || []) {
    const mdId = r.id.slice(3);
    const chapters = new Map();
    for (let off = 0; off < 1500; off += 500) {
      const j = await fetchJson(`https://api.mangadex.org/manga/${mdId}/feed?limit=500&offset=${off}&translatedLanguage[]=en&order[chapter]=asc&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica`, { headers: UA });
      for (const c of j.data || []) {
        const n = parseFloat(c.attributes?.chapter);
        if (Number.isNaN(n) || chapters.has(n)) continue;
        chapters.set(n, { media_id: r.id, chapter: n, released_at: (c.attributes.publishAt || '').slice(0, 10) || null, ext_id: c.id });
      }
      if ((j.data || []).length < 500) break;
      await sleep(300);
    }
    if (chapters.size) await upsertBatches(sb, 'media_chapters', [...chapters.values()], 'media_id,chapter', 500);
    await sb.from('media_catalog').update({ chapters_synced_at: new Date().toISOString() }).eq('id', r.id);
    done++;
    await sleep(300);
  }
  summary.fullLists = done;
}

await runJob('sync-chapters', async (sb) => {
  const summary = {};
  const steps = [animeEpisodes, mangadexLatest, muRecent, muMapSeries, muBaseline, followedFullLists];
  for (const step of steps) {
    try { await step(sb, summary); } catch (e) { summary[step.name + 'Error'] = String(e.message).slice(0, 120); }
  }
  if (steps.every((s) => summary[s.name + 'Error'])) throw new Error('All chapter sources failed: ' + JSON.stringify(summary));
  return summary;
});
