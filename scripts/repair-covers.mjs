import { runJob, upsertBatches } from './lib/common.mjs';
import { healCover } from './lib/covers.mjs';

const BUDGET_MS = Number(process.env.COVER_BUDGET_MIN || 20) * 60 * 1000;
const PAGE = 400;
const CONCURRENCY = 6;
const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
const QUEUE = `cover_checked_at.is.null,and(cover_ok.eq.false,cover_checked_at.lt.${daysAgo(7)}),and(cover_ok.eq.true,cover_checked_at.lt.${daysAgo(90)})`;

await runJob('repair-covers', async (sb) => {
  const start = Date.now();
  const summary = { checked: 0, ok: 0, normalized: 0, replaced: 0, missing: 0, unknown: 0, linksCleaned: 0 };

  while (Date.now() - start < BUDGET_MS) {
    const { data: rows, error } = await sb.from('media_catalog')
      .select('id,source_type,media_type,slug,title_primary,al_id,cover_url,official_links')
      .or(QUEUE).order('cover_checked_at', { ascending: true, nullsFirst: true }).limit(PAGE);
    if (error) throw error;
    if (!rows.length) break;

    const updates = [];
    let i = 0;
    const worker = async () => {
      while (i < rows.length) {
        const row = rows[i++];
        const r = await healCover(row);
        summary.checked++; summary[r.changed]++;
        const { changed, ...cols } = r;
        const links = Array.isArray(row.official_links) ? row.official_links : [];
        const clean = links.filter((l) => l && /^https?:\/\//i.test(l.url || ''));
        const linkFix = clean.length !== links.length ? { official_links: clean, links_checked_at: cols.cover_checked_at } : {};
        if (linkFix.official_links) summary.linksCleaned++;
        updates.push({ id: row.id, source_type: row.source_type, media_type: row.media_type, slug: row.slug, title_primary: row.title_primary, ...cols, ...linkFix });
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    await upsertBatches(sb, 'media_catalog', updates, 'id');
  }

  const { count } = await sb.from('media_catalog').select('id', { count: 'exact', head: true }).or(QUEUE);
  summary.stillQueued = count;
  return summary;
});
