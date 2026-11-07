import { runJob, fetchJson, sleep, norm, slugify, clip, stripHtml, readAll, upsertBatches } from './lib/common.mjs';
import { extractOfficialLinks } from './lib/official-sources.mjs';

const TARGETS = { anime: 4000, manga: 5000, manhwa: 3000, manhua: 2000, novel: 3000 };
const PER_PAGE = 50;
const PAGES_PER_RUN = Number(process.env.PAGES_PER_RUN || 8);

const TYPES = {
  anime:  { type: 'ANIME', format_in: ['TV', 'TV_SHORT', 'MOVIE', 'OVA', 'ONA'] },
  manga:  { type: 'MANGA', countryOfOrigin: 'JP', format_in: ['MANGA', 'ONE_SHOT'] },
  manhwa: { type: 'MANGA', countryOfOrigin: 'KR', format_in: ['MANGA'] },
  manhua: { type: 'MANGA', countryOfOrigin: 'CN', format_in: ['MANGA'] },
  novel:  { type: 'MANGA', format_in: ['NOVEL'] },
};

const QUERY = `
query ($page: Int, $perPage: Int, $type: MediaType, $format_in: [MediaFormat], $countryOfOrigin: CountryCode) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { hasNextPage }
    media(type: $type, format_in: $format_in, countryOfOrigin: $countryOfOrigin, isAdult: false, sort: POPULARITY_DESC) {
      id format status popularity averageScore episodes chapters genres
      title { english romaji native }
      coverImage { large }
      bannerImage
      description(asHtml: false)
      nextAiringEpisode { episode }
      externalLinks { site url }
    }
  }
}`;

const mapStatus = (s) => (s === 'FINISHED' || s === 'CANCELLED' ? 'finished' : 'releasing');

await runJob('sync-popular', async (sb) => {
  const { data: last } = await sb.from('bot_runs').select('summary').eq('job', 'sync-popular').eq('ok', true)
    .order('created_at', { ascending: false }).limit(1);
  const cursors = { ...(last?.[0]?.summary?.cursors || {}) };

  const existing = await readAll(sb, 'media_catalog', 'id,source_type,media_type,slug,title_primary,title_secondary,al_id,cover_url');
  const byAl = new Map(), byTitle = new Map();
  for (const r of existing) {
    if (r.al_id) byAl.set(r.al_id, r);
    for (const t of [r.title_primary, r.title_secondary]) {
      const k = `${r.media_type}:${norm(t)}`;
      if (norm(t).length > 2 && !byTitle.has(k)) byTitle.set(k, r);
    }
  }

  const summary = { added: 0, updated: 0, cursors: {} };
  const usedIds = new Set();

  for (const [mediaType, filt] of Object.entries(TYPES)) {
    let page = cursors[mediaType] || 1;
    const maxPage = Math.ceil(TARGETS[mediaType] / PER_PAGE);
    if (page > maxPage) page = 1;
    const rows = [];

    for (let i = 0; i < PAGES_PER_RUN && page <= maxPage; i++, page++) {
      const vars = { page, perPage: PER_PAGE, type: filt.type, format_in: filt.format_in, countryOfOrigin: filt.countryOfOrigin };
      const json = await fetchJson('https://graphql.anilist.co', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query: QUERY, variables: vars }),
      });
      for (const m of json.data?.Page?.media || []) {
        const english = m.title.english, romaji = m.title.romaji;
        const primary = english || romaji;
        if (!primary) continue;

        const match = byAl.get(m.id) || byTitle.get(`${mediaType}:${norm(english)}`) || byTitle.get(`${mediaType}:${norm(romaji)}`);
        const latest = mediaType === 'anime'
          ? (m.nextAiringEpisode ? m.nextAiringEpisode.episode - 1 : m.episodes || null)
          : null;
        const common = {
          al_id: m.id,
          popularity: m.popularity || 0,
          score: m.averageScore ? Math.round(m.averageScore) / 10 : null,
          status: mapStatus(m.status),
          total_units: (mediaType === 'anime' ? m.episodes : m.chapters) || 0,
          ...(latest ? { latest_chapter: latest } : {}),
        };
        const badCover = (u) => !u || /placeholder|default|no-image|unsplash/i.test(u);

        if (match) {
          if (usedIds.has(match.id)) continue;
          usedIds.add(match.id);
          rows.push({
            id: match.id, source_type: match.source_type, media_type: match.media_type,
            slug: match.slug, title_primary: match.title_primary, ...common,
            ...(badCover(match.cover_url) && m.coverImage?.large ? { cover_url: m.coverImage.large, cover_ok: true } : {}),
          });
          summary.updated++;
        } else {
          const id = `al-${m.id}`;
          if (usedIds.has(id)) continue;
          usedIds.add(id);
          rows.push({
            id, source_type: 'anilist', media_type: mediaType,
            slug: `${slugify(primary)}-al-${m.id}`,
            title_primary: clip(primary, 200),
            title_secondary: romaji && romaji !== primary ? clip(romaji, 200) : null,
            cover_url: m.coverImage?.large || null,
            banner_url: m.bannerImage || null,
            synopsis: clip(stripHtml(m.description), 600),
            format: (m.format || mediaType).toUpperCase(),
            genres: (m.genres || []).slice(0, 8),
            official_links: extractOfficialLinks(m.externalLinks || []).slice(0, 6).map((l) => ({ site: l.site, url: l.url })),
            cover_ok: !!m.coverImage?.large,
                        cover_checked_at: new Date().toISOString().slice(0, 10),
            ...common,
          });
          summary.added++;
        }
      }
      if (!json.data?.Page?.pageInfo?.hasNextPage) { page = maxPage + 1; break; }
      await sleep(1200);
    }
    summary.cursors[mediaType] = page > maxPage ? 1 : page;
    if (rows.length) await upsertBatches(sb, 'media_catalog', rows, 'id');
  }
  return summary;
});
