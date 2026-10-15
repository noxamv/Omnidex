const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[Omnidex] Missing Supabase environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    transport: WebSocket,
  },
});

const GRAPHQL_ENDPOINT = 'https://graphql.anilist.co';

const QUERY = `
query ($page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    media(sort: TRENDING_DESC) {
      id
      type
      format
      title {
        english
        romaji
      }
      coverImage {
        extraLarge
      }
      bannerImage
      description
      status
      averageScore
      episodes
      chapters
      genres
      countryOfOrigin
      externalLinks {
        site
        url
      }
    }
  }
}
`;

function determineMediaType(item) {
  if (item.type === 'ANIME') return 'anime';
  if (item.countryOfOrigin === 'KR' || item.format === 'MANHWA') return 'manhwa';
  if (item.countryOfOrigin === 'CN') return 'manhua';
  if (item.format === 'NOVEL') return 'novel';
  return 'manga';
}

function filterOfficialLinks(links) {
  if (!links) return [];
  const officialTargets = [
    'crunchyroll', 'netflix', 'webtoon', 'tapas', 'tappytoon', 
    'bookwalker', 'kobo', 'royal road', 'bilibili comics', 'manga plus'
  ];

  return links
    .filter(l => officialTargets.some(target => (l.site || '').toLowerCase().includes(target)))
    .map(l => ({ site: l.site, url: l.url }));
}

async function runSync() {
  console.log('[Omnidex] Starting automated catalog sync...');

  for (let page = 1; page <= 3; page++) {
    console.log(`[Omnidex] Fetching page ${page}...`);
    const res = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: QUERY, variables: { page, perPage: 50 } }),
    });

    const json = await res.json();
    const mediaList = json.data?.Page?.media || [];

    const upsertRows = mediaList.map((item) => {
      const title = item.title.english || item.title.romaji || 'Untitled';
      const cleanSlug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${item.id}`;

      return {
        id: `al-${item.id}`,
        source_type: 'anilist',
        media_type: determineMediaType(item),
        slug: cleanSlug,
        title_primary: title,
        title_secondary: item.title.romaji,
        cover_url: item.coverImage?.extraLarge,
        banner_url: item.bannerImage,
        synopsis: item.description ? item.description.replace(/<[^>]*>?/gm, '') : '',
        status: item.status?.toLowerCase() || 'releasing',
        format: item.format,
        score: item.averageScore ? Number((item.averageScore / 10).toFixed(1)) : null,
        total_units: item.episodes || item.chapters || 0,
        genres: item.genres || [],
        official_links: filterOfficialLinks(item.externalLinks),
        updated_at: new Date().toISOString(),
      };
    });

    const { error } = await supabase
      .from('media_catalog')
      .upsert(upsertRows, { onConflict: 'id' });

    if (error) {
      console.error('[Omnidex] Supabase error:', error.message);
    } else {
      console.log(`[Omnidex] Page ${page} synchronized successfully (${upsertRows.length} titles).`);
    }

    await new Promise((r) => setTimeout(r, 1200));
  }

  console.log('[Omnidex] Catalog sync completed.');
}

runSync().catch((err) => {
  console.error('[Omnidex] Fatal error in sync execution:', err);
  process.exit(1);
});
