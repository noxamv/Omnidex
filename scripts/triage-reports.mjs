import { runJob, fetchJson } from './lib/common.mjs';
import { healCover, linkIsDead } from './lib/covers.mjs';

await runJob('triage-reports', async (sb) => {
  const { data: reports, error } = await sb.from('media_reports').select('id,media_id,issue_type')
    .eq('status', 'open').eq('automated_action', 'pending_bot_triage').order('created_at').limit(100);
  if (error) throw error;

  const summary = { handled: 0, resolved: 0, flagged: 0 };
  const done = new Set();

  for (const rep of reports || []) {
    let resolved = false;
    try {
      const { data: row } = await sb.from('media_catalog')
        .select('id,media_type,al_id,title_primary,cover_url,official_links,total_units').eq('id', rep.media_id).maybeSingle();

      if (!row) { resolved = true; }
      else if (rep.issue_type === 'incorrect_info' && !done.has(row.id + 'c')) {
        const r = await healCover(row);
        if (r.changed === 'replaced' || r.changed === 'normalized') {
          const { changed, ...cols } = r;
          await sb.from('media_catalog').update(cols).eq('id', row.id);
          resolved = r.changed === 'replaced';
        }
        done.add(row.id + 'c');
      } else if (rep.issue_type === 'broken_link' && !done.has(row.id + 'l')) {
        const links = Array.isArray(row.official_links) ? row.official_links : [];
        const alive = [];
        for (const l of links) if (!(await linkIsDead(l.url))) alive.push(l);
        if (alive.length !== links.length) {
          await sb.from('media_catalog').update({ official_links: alive, links_checked_at: new Date().toISOString().slice(0, 10) }).eq('id', row.id);
          resolved = true;
        }
        done.add(row.id + 'l');
      } else if (rep.issue_type === 'wrong_chapters' && row.al_id) {
        const j = await fetchJson('https://graphql.anilist.co', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: 'query($id:Int){Media(id:$id){episodes chapters}}', variables: { id: row.al_id } }),
        }, { retries: 1 });
        const total = (row.media_type === 'anime' ? j.data?.Media?.episodes : j.data?.Media?.chapters) || 0;
        if (total && total !== row.total_units) {
          await sb.from('media_catalog').update({ total_units: total }).eq('id', row.id);
          resolved = true;
        }
      }
    } catch (e) { console.warn('triage error', rep.id, e.message); }

    await sb.from('media_reports').update({
      status: resolved ? 'resolved' : 'needs_review',
      automated_action: resolved ? 'bot_resolved' : 'bot_flagged',
      resolved_by_bot: resolved,
      updated_at: new Date().toISOString(),
    }).eq('id', rep.id);
    summary.handled++;
    summary[resolved ? 'resolved' : 'flagged']++;
  }
  return summary;
});
