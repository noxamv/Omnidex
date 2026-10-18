const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[Omnidex] Missing Supabase environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: WebSocket },
});

const GRAPHQL_ENDPOINT = 'https://graphql.anilist.co';

const QUERY = `
query ($page: Int, $perPage: Int, $type: MediaType, $format: MediaFormat) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      hasNextPage
    }
    media(sort: TRENDING_DESC, type: $type, format: $format) {
      id
      type
      format
      title { english romaji native }
      coverImage { extraLarge }
      bannerImage
      description
      status
      averageScore
      episodes
      chapters
      genres
      countryOfOrigin
      externalLinks { site url }
    }
  }
}
`;

function determineMediaType(item) {
  if (item.format === 'NOVEL' || item.type === 'NOVEL') return 'novel';
  if (item.type === 'ANIME') return 'anime';
  if (item.countryOfOrigin === 'KR' || item.format === 'MANHWA') return 'manhwa';
  if (item.countryOfOrigin === 'CN') return 'manhua';
  return 'manga';
}

function filterOfficialLinks(item) {
  const links = item.externalLinks || [];
  const officialTargets = [
    'royal road', 'webnovel', 'wattpad', 'scribble hub', 'j-novel club', 
    'yen press', 'bookwalker', 'kobo', 'amazon',
    'webtoon', 'tapas', 'tappytoon', 'lezhin', 'toomics', 'pocket comics',
    'manga plus', 'viz', 'kodansha', 'comikey', 'bilibili comics', 'k manga', 'inkr',
    'crunchyroll', 'netflix', 'hidive', 'disney', 'hulu', 'prime video', 'youtube'
  ];

  const matched = links
    .filter(l => l && l.url && officialTargets.some(t => (l.site || '').toLowerCase().includes(t)))
    .map(l => ({ site: l.site, url: l.url }));

  // Fallback search link if no direct links are available
  if (matched.length === 0) {
    const title = encodeURIComponent(item.title?.english || item.title?.romaji || 'series');
    if (item.type === 'ANIME') {
      matched.push({ site: 'Crunchyroll', url: `https://www.crunchyroll.com/search?q=${title}` });
    } else if (item.countryOfOrigin === 'KR' || item.format === 'MANHWA') {
      matched.push({ site: 'WEBTOON', url: `https://www.webtoons.com/en/search?keyword=${title}` });
    } else if (item.format === 'NOVEL') {
      matched.push({ site: 'BookWalker', url: `https://global.bookwalker.jp/search/?word=${title}` });
    } else {
      matched.push({ site: 'MANGA Plus', url: `https://mangaplus.shueisha.co.jp/search_result?keyword=${title}` });
    }
  }

  return matched;
}

function resolveSynopsis(item) {
  if (item.description && item.description.trim().length > 10) {
    return item.description.replace(/<[^>]*>?/gm, '');
  }
  const title = item.title?.english || item.title?.romaji || 'This series';
  return `${title} is an officially tracked ${item.format || item.type} on Omnidex. Follow official source links for verified releases and translations.`;
}

async function fetchAniListPage(variables) {
  try {
    const res = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query: QUERY, variables }),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data?.Page?.media || [];
  } catch (err) {
    console.error('[Omnidex] Fetch error:', err.message);
    return [];
  }
}

async function runSync() {
  console.log('[Omnidex] Starting extended catalog sync (Targeting ~300-500 titles)...');

  let allRaw = [];

  // 1. Fetch 3 pages of Trending General Media (Anime, Manga, Manhwa)
  for (let p = 1; p <= 3; p++) {
    console.log(`[Omnidex] Fetching general media page ${p}...`);
    const pageItems = await fetchAniListPage({ page: p, perPage: 50 });
    allRaw = [...allRaw, ...pageItems];
    await new Promise((r) => setTimeout(r, 700));
  }

  // 2. Fetch 2 pages of Trending Web & Light Novels
  for (let p = 1; p <= 2; p++) {
    console.log(`[Omnidex] Fetching novels page ${p}...`);
    const novelItems = await fetchAniListPage({ page: p, perPage: 50, type: 'MANGA', format: 'NOVEL' });
    allRaw = [...allRaw, ...novelItems];
    await new Promise((r) => setTimeout(r, 700));
  }

  const upsertRows = allRaw.map((item) => {
    const title = item.title?.english || item.title?.romaji || item.title?.native || 'Untitled';
    const cleanSlug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${item.id}`;

    return {
      id: `al-${item.id}`,
      source_type: 'anilist',
      media_type: determineMediaType(item),
      slug: cleanSlug,
      title_primary: title,
      title_secondary: item.title?.romaji || null,
      cover_url: item.coverImage?.extraLarge || null,
      banner_url: item.bannerImage || null,
      synopsis: resolveSynopsis(item),
      status: item.status?.toLowerCase() || 'releasing',
      format: item.format || 'UNKNOWN',
      score: item.averageScore ? Number((item.averageScore / 10).toFixed(1)) : null,
      total_units: item.episodes || item.chapters || 0,
      genres: Array.isArray(item.genres) ? item.genres : [],
      official_links: filterOfficialLinks(item),
      updated_at: new Date().toISOString(),
    };
  });

  // Deduplicate items by ID
  const uniqueRows = Array.from(new Map(upsertRows.map(item => [item.id, item])).values());

  const { error } = await supabase
    .from('media_catalog')
    .upsert(uniqueRows, { onConflict: 'id' });

  if (error) {
    console.error('[Omnidex] Upsert error:', error.message);
  } else {
    console.log(`[Omnidex] Successfully synchronized ${uniqueRows.length} titles to media_catalog.`);
  }
}

runSync().catch(console.error);
