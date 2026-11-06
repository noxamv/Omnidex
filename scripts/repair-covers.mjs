import { runJob, upsertBatches } from './lib/common.mjs';
import { healCover } from './lib/covers.mjs';

const BATCH = Number(process.env.COVER_BATCH || 300);
const CONCURRENCY = 6;

await runJob('repair-covers', async (sb) => {
  const { data: rows, error } = await sb.from('media_catalog')
    .select('id,source_type,media_type,slug,title_primary,al_id,cover_url,official_links')
    .order('cover_checked_at', { ascending: true, nullsFirst: true })
    .limit(BATCH);
  if (error) throw error;

  const summary = { checked: 0, ok: 0, normalized: 0, replaced: 0, missing: 0, unknown: 0, linksCleaned: 0 };
  const updates = [];
  let i = 0;

  async function worker() {
    while (i < rows.length) {
      const row = rows[i++];
      const r = await healCover(row);
      summary.checked++;
      summary[r.changed]++;
      const { changed, ...cols } = r;
      const links = Array.isArray(row.official_links) ? row.official_links : [];
      const clean = links.filter((l) => l && /^https?:\/\//i.test(l.url || ''));
      const linkFix = clean.length !== links.length ? { official_links: clean, links_checked_at: cols.cover_checked_at } : {};
      if (linkFix.official_links) summary.linksCleaned++;
      updates.push({
        id: row.id, source_type: row.source_type, media_type: row.media_type, slug: row.slug,
        title_primary: row.title_primary, ...cols, ...linkFix,
      });
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  if (updates.length) await upsertBatches(sb, 'media_catalog', updates, 'id');
  return summary;
});
