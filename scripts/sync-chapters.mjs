import { runJob, fetchJson, sleep, upsertBatches } from './lib/common.mjs';

const UA = { 'User-Agent': 'Omnidex-Bot/1.0 (+github actions)' };

async function latestAnimeEpisodes(sb, summary) {
  const now = Math.floor(Date.now() / 1000);
  const since = now - 36 * 3600;
  const q = `query($page:Int,$since:Int,$until:Int){ Page(page:$page,perPage:50){ pageInfo{hasNextPage}
    airingSchedules(airingAt_greater:$since, airingAt_lesser:$until, sort:TIME_DESC){ mediaId episode airingAt } } }`;
  const seen = new Map();
  for (let page = 1; page <= 6; page++) {
    const j = await fetchJson('https://graphql.anilist.co', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q, variables: { page, since, until: now } }),
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
    const { data: rows } = await sb.from('media_catalog')
      .select('id,al_id,latest_chapter').in('al_id', ids.slice(i, i + 100));
    for (const r of rows || []) {
      const s = seen.get(r.al_id);
      if (!s || (r.latest_chapter || 0) >= s.episode) continue;
      await sb.from('media_catalog').update({
        latest_chapter: s.episode,
        latest_chapter_at: new Date(s.airingAt * 1000).toISOString().slice(0, 10),
        updated_at: new Date().toISOString(),
      }).eq('id', r.id);
      updated++;
    }
  }
  summary.animeUpdated = updated;
}

async function latestMangaChapters(sb, summary) {
  const latest = new Map();
  for (let p = 0; p < 6; p++) {
    const url = 'https://api.mangadex.org/chapter?limit=100&offset=' + p * 100 +
      '&translatedLanguage[]=en&order[publishAt]=desc&includes[]=manga&contentRating[]=safe&contentRating[]=suggestive';
    const j = await fetchJson(url, { headers: UA });
    for (const c of j.data || []) {
      const mangaId = c.relationships?.find((r) => r.type === 'manga')?.id;
      const num = parseFloat(c.attributes?.chapter);
      if (!mangaId || Number.isNaN(num)) continue;
      const cur = latest.get(mangaId);
      if (!cur || num > cur.num) latest.set(mangaId, { num, at: (c.attributes.publishAt || '').slice(0, 10) });
    }
    await sleep(400);
  }
  const ids = [...latest.keys()].map((i) => `md-${i}`);
  let updated = 0;
  for (let i = 0; i < ids.length; i += 100) {
    const { data: rows } = await sb.from('media_catalog').select('id,latest_chapter').in('id', ids.slice(i, i + 100));
    for (const r of rows || []) {
      const l = latest.get(r.id.slice(3));
      if (!l || (r.latest_chapter || 0) >= l.num) continue;
      await sb.from('media_catalog').update({
        latest_chapter: l.num, latest_chapter_at: l.at || null, updated_at: new Date().toISOString(),
      }).eq('id', r.id);
      updated++;
    }
  }
  summary.mangaUpdated = updated;
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
  for (const step of [latestAnimeEpisodes, latestMangaChapters, followedFullLists]) {
    try { await step(sb, summary); } catch (e) { summary[step.name + 'Error'] = String(e.message).slice(0, 120); }
  }
  if (Object.keys(summary).every((k) => k.endsWith('Error'))) throw new Error('All chapter sources failed: ' + JSON.stringify(summary));
  return summary;
});
