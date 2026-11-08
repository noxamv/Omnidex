import { fetchJson, sleep, norm } from './common.mjs';

const UA = { 'User-Agent': 'Omnidex-Bot/1.0 (tracker; +github actions)' };
const MU = 'https://api.mangaupdates.com/v1';
const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
const maxNum = (s) => {
  const n = String(s ?? '').match(/\d+(?:\.\d+)?/g);
  return n ? Math.max(...n.map(Number)) : NaN;
};
const MU_TYPE = { manga: 'manga', manhwa: 'manhwa', manhua: 'manhua', novel: 'novel' };

export async function muRecentStep(sb, summary) {
  const best = new Map();
  const titleOf = new Map();
  let parsed = 0, sample = null;

  for (let page = 1; page <= 12; page++) {
    let j;
    try {
      j = await fetchJson(`${MU}/releases/days?include_metadata=true&page=${page}&perpage=100`, { headers: { ...UA, Accept: 'application/json' } }, { retries: 1 });
    } catch (e) { if (page === 1) throw e; break; }
    const items = j.results || [];
    if (!items.length) break;
    sample ||= Object.keys(items[0] || {}).concat(Object.keys(items[0]?.record || {}));
    for (const it of items) {
      const rec = it.record || it;
      const sid = it.metadata?.series?.series_id ?? rec.series_id;
      const ch = maxNum(rec.chapter);
      if (!sid || Number.isNaN(ch)) continue;
      const cur = best.get(sid);
      if (!cur || ch > cur.ch) best.set(sid, { ch, date: String(rec.release_date || '').slice(0, 10) });
      const title = it.metadata?.series?.title || rec.title;
      if (title) titleOf.set(sid, String(title));
      parsed++;
    }
    await sleep(500);
  }
  if (!parsed) { summary.muRecentNote = 'nothing parsed, keys: ' + JSON.stringify(sample); return; }

  const names = new Map();
  for (const [sid, title] of titleOf) {
    const k = norm(title);
    if (k.length < 4) continue;
    names.set(k, names.has(k) && names.get(k) !== sid ? null : sid);
  }

  const titles = [...new Set(titleOf.values())].filter((t) => !/["\\]/.test(t));
  const found = new Map();
  for (let i = 0; i < titles.length; i += 60) {
    const chunk = titles.slice(i, i + 60);
    for (const col of ['title_primary', 'title_secondary']) {
      const { data } = await sb.from('media_catalog')
        .select('id,mu_id,media_type,title_primary,title_secondary,latest_chapter')
        .in(col, chunk).neq('media_type', 'anime');
      for (const r of data || []) {
        const sid = names.get(norm(r[col]));
        if (sid) found.set(r.id, { r, sid });
      }
    }
  }
  const typesBySid = new Map();
  for (const { r, sid } of found.values()) {
    if (!typesBySid.has(sid)) typesBySid.set(sid, new Set());
    typesBySid.get(sid).add(r.media_type);
  }
  let mapped = 0, updated = 0;
  for (const { r, sid } of found.values()) {
    if (typesBySid.get(sid).size > 1) continue;
    const patch = {};
    if (!r.mu_id) { patch.mu_id = sid; mapped++; }
    const b = best.get(sid);
    if (b && b.ch > (r.latest_chapter || 0)) {
      Object.assign(patch, { latest_chapter: b.ch, latest_chapter_at: b.date || today(), updated_at: new Date().toISOString() });
      updated++;
    }
    if (Object.keys(patch).length) await sb.from('media_catalog').update(patch).eq('id', r.id);
  }

  const ids = [...best.keys()];
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
  summary.muParsed = parsed; summary.muMappedByTitle = mapped; summary.muUpdated = updated;
}

export async function muMapStep(sb, summary) {
  const { data: rows } = await sb.from('media_catalog').select('id,title_primary,media_type')
    .is('mu_id', null).eq('status', 'releasing').in('media_type', Object.keys(MU_TYPE))
    .or(`mu_checked_at.is.null,mu_checked_at.lt.${daysAgo(30)}`)
    .order('popularity', { ascending: false }).limit(120);
  let mapped = 0;
  for (const r of rows || []) {
    let id = null;
    try {
      const j = await fetchJson(`${MU}/series/search`, {
        method: 'POST', headers: { ...UA, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ search: r.title_primary, perpage: 6 }),
      }, { retries: 1 });
      for (const hit of j.results || []) {
        const rec = hit.record || hit;
        const type = String(rec.type || '').toLowerCase();
        const typeOk = !type || type.includes(MU_TYPE[r.media_type]) || (r.media_type === 'manga' && !/manhwa|manhua|novel/.test(type));
        const titles = [rec.title, hit.hit_title].map(norm);
        if (typeOk && titles.includes(norm(r.title_primary)) && rec.series_id) { id = rec.series_id; break; }
      }
    } catch { /* try again in 30 days */ }
    await sb.from('media_catalog').update(id ? { mu_id: id } : { mu_checked_at: today() }).eq('id', r.id);
    if (id) mapped++;
    await sleep(700);
  }
  summary.muMapped = mapped;
}

export async function muBaselineStep(sb, summary) {
  const { data: rows } = await sb.from('media_catalog').select('id,mu_id')
    .not('mu_id', 'is', null).is('latest_chapter', null)
    .or(`mu_checked_at.is.null,mu_checked_at.lt.${daysAgo(7)}`).limit(150);
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
    await sleep(700);
  }
  summary.muBaseline = filled;
}
