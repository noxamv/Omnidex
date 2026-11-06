import { readFileSync } from 'node:fs';
import { runJob, fetchText, norm, clip, stripHtml, sleep } from './lib/common.mjs';

const feeds = JSON.parse(readFileSync(new URL('./feeds.json', import.meta.url), 'utf8'));
const MAX_PER_FEED = 25;
const MAX_AGE_MS = 7 * 24 * 3600 * 1000;

const unCdata = (s) => (s || '').replace(/^\s*<!\[CDATA\[/, '').replace(/\]\]>\s*$/, '').trim();
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'");
const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? unCdata(m[1]) : '';
};

function parseFeed(xml) {
  const blocks = xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi) || [];
  return blocks.map((b) => {
    let link = decode(tag(b, 'link'));
    if (!link) link = (b.match(/<link[^>]*href=["']([^"']+)["']/i) || [])[1] || '';
    return {
      title: stripHtml(decode(tag(b, 'title'))),
      link: decode(link).trim(),
      summary: stripHtml(decode(tag(b, 'description') || tag(b, 'summary') || tag(b, 'content:encoded') || tag(b, 'content'))),
      date: tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated') || tag(b, 'dc:date'),
    };
  });
}

function guessType(text, fallback) {
  const t = ` ${text.toLowerCase()} `;
  if (/\b(manhwa|webtoon|korean)\b/.test(t)) return 'manhwa';
  if (/\b(manhua|donghua|chinese)\b/.test(t)) return 'manhua';
  if (/\b(light novel|web novel|novel|ln)\b/.test(t)) return 'novel';
  if (/\b(manga|chapter|volume|shonen|seinen|shojo)\b/.test(t)) return 'manga';
  if (/\b(anime|season|episode|trailer|pv|cour|visual)\b/.test(t)) return 'anime';
  return fallback || null;
}

await runJob('sync-news', async (sb) => {
  const { data: top } = await sb.from('media_catalog').select('id,title_primary').order('popularity', { ascending: false }).limit(4000);
  const titles = (top || []).map((r) => [norm(r.title_primary), r.id]).filter(([n]) => n.length >= 8)
    .sort((a, b) => b[0].length - a[0].length);

  const summary = { feeds: {}, inserted: 0 };
  let okFeeds = 0;

  for (const f of feeds) {
    try {
      const xml = await fetchText(f.url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OmnidexBot/1.0; news reader)', Accept: 'application/rss+xml, application/atom+xml, text/xml, */*' } }, 20000);
      const rows = [];
      for (const it of parseFeed(xml).slice(0, MAX_PER_FEED)) {
        if (!it.title || !/^https?:\/\//i.test(it.link) || it.link.length > 500) continue;
        const ts = Date.parse(it.date);
        const published = Number.isNaN(ts) ? Date.now() : Math.min(ts, Date.now());
        if (Date.now() - published > MAX_AGE_MS) continue;
        const haystack = norm(it.title);
        const hit = titles.find(([n]) => haystack.includes(n));
        rows.push({
          title: clip(it.title, 200),
          excerpt: clip(it.summary, 280),
          url: it.link,
          source: clip(f.name, 60),
          media_type: guessType(`${it.title} ${it.summary.slice(0, 200)}`, f.media_type),
          media_id: hit ? hit[1] : null,
          published_at: new Date(published).toISOString(),
        });
      }
      if (rows.length) {
        const { error } = await sb.from('news_items').upsert(rows, { onConflict: 'url', ignoreDuplicates: true });
        if (error) throw error;
      }
      summary.feeds[f.name] = rows.length;
      summary.inserted += rows.length;
      okFeeds++;
    } catch (e) {
      summary.feeds[f.name] = `error: ${String(e.message).slice(0, 60)}`;
    }
    await sleep(1500);
  }
  if (okFeeds === 0) throw new Error('Every news feed failed: ' + JSON.stringify(summary.feeds));
  return summary;
});
