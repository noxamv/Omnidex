export const JOBS = [
  { name: 'sync-chapters',  every: 25,   timeoutMin: 25 },
  { name: 'sync-news',      every: 25,   timeoutMin: 8 },
  { name: 'sync-popular',   every: 180,  timeoutMin: 10 },
  { name: 'repair-covers',  every: 360,  timeoutMin: 25 },
  { name: 'triage-reports', every: 360,  timeoutMin: 8 },
  { name: 'maintenance',    every: 1440, timeoutMin: 3 },
];

export function pickDue(lastOk, now, forced = []) {
  const f = forced.filter(Boolean);
  if (f.length) {
    return f.includes('all') ? JOBS : JOBS.filter((j) => f.includes(j.name));
  }
  return JOBS.filter((j) => {
    const last = lastOk[j.name];
    return !last || (now - Date.parse(last)) / 60000 >= j.every;
  });
}
