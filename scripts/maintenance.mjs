import { runJob } from './lib/common.mjs';

const WARN_MB = Number(process.env.DB_WARN_MB || 400);

await runJob('maintenance', async (sb) => {
  for (const fn of ['prune_old_data', 'prune_bot_runs']) {
    const { error } = await sb.rpc(fn);
    if (error) throw new Error(`${fn}: ${error.message}`);
  }
  const { data, error } = await sb.rpc('storage_report');
  if (error) throw error;
  const dbRow = (data || []).find((r) => r.item.startsWith('DATABASE'));
  const mb = parseFloat(dbRow?.size) * (/GB/i.test(dbRow?.size) ? 1024 : /kB/i.test(dbRow?.size) ? 1 / 1024 : 1);
  const tables = Object.fromEntries((data || []).filter((r) => !r.item.startsWith('DATABASE')).map((r) => [r.item, r.size]));
  if (mb > WARN_MB) throw new Error(`Database is ${dbRow.size} (warn at ${WARN_MB} MB). Run prune_catalog or upgrade.`);
  return { database: dbRow?.size, tables };
});
