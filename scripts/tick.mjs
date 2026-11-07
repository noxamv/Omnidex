import { spawnSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { db } from './lib/common.mjs';
import { JOBS, pickDue } from './lib/schedule.mjs';

const sb = db();
const forced = (process.env.FORCE_JOBS || '').split(/[\s,]+/).filter(Boolean);

const { data } = await sb.from('bot_runs').select('job,created_at').eq('ok', true)
  .in('job', JOBS.map((j) => j.name)).order('created_at', { ascending: false }).limit(300);
const lastOk = {};
for (const r of data || []) if (!lastOk[r.job]) lastOk[r.job] = r.created_at;

const due = pickDue(lastOk, Date.now(), forced);
console.log('Due this tick:', due.map((j) => j.name).join(', ') || 'nothing');

const failed = [];
for (const job of due) {
  console.log(`::group::${job.name}`);
  const res = spawnSync(process.execPath, [`scripts/${job.name}.mjs`], {
    stdio: 'inherit', env: process.env, timeout: job.timeoutMin * 60 * 1000,
  });
  if (res.status !== 0) failed.push(job.name);
  console.log('::endgroup::');
}

if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `failed=${failed.join(' ')}\n`);
console.log(failed.length ? `Failed: ${failed.join(', ')}` : 'All due jobs finished.');
