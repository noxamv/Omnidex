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
    media(sort: TRENDING_DESC, type: $type, format: $format) {
      id
      type
      format
      title { english romaji }
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

function filterOfficialLinks(links) {
  if (!Array.isArray(links)) return [];
  const officialTargets = [
    'royal road', 'webnovel', 'wattpad', 'scribble hub', 'j-novel club', 
    'yen press', 'bookwalker', 'kobo', 'amazon',
    'webtoon', 'tapas', 'tappytoon', 'lezhin', 'toomics', 'pocket comics',
    'manga plus', 'viz', 'kodansha', 'comikey', 'bilibili comics', 'k manga', 'inkr',
    'crunchyroll', 'netflix', 'hidive', 'disney', 'hulu', 'prime video', 'youtube'
  ];

  return links
    .filter(l => l && l.url && officialTargets.some(t => (l.site || '').toLowerCase().includes(t)))
    .map(l => ({ site: l.site, url: l.url }));
}

async function fetchFromAniList(variables) {
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
  console.log('[Omnidex] Starting comprehensive global catalog sync...');

  const generalMedia = await fetchFromAniList({ page: 1, perPage: 50 });
  const novelMedia = await fetchFromAniList({ page: 1, perPage: 35, type: 'MANGA', format: 'NOVEL' });

  const globalCuratedWebNovels = [
    {
      id: 'rr-primal-hunter',
      source_type: 'royalroad',
      media_type: 'novel',
      slug: 'the-primal-hunter',
      title_primary: 'The Primal Hunter',
      title_secondary: 'Zogarth',
      cover_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80',
      banner_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&q=80',
      synopsis: 'A world abruptly plunged into a multiverse-wide system apocalypse where hunter instincts rule supreme.',
      status: 'releasing',
      format: 'WEB NOVEL',
      score: 9.4,
      total_units: 950,
      genres: ['Action', 'Fantasy', 'LitRPG'],
      official_links: [
        { site: 'Royal Road', url: 'https://www.royalroad.com/fiction/36049/the-primal-hunter' },
        { site: 'Amazon', url: 'https://www.amazon.com/dp/B09MV3GMT4' }
      ],
      updated_at: new Date().toISOString(),
    },
    {
      id: 'rr-defiance-of-fall',
      source_type: 'royalroad',
      media_type: 'novel',
      slug: 'defiance-of-the-fall',
      title_primary: 'Defiance of the Fall',
      title_secondary: 'TheFirstDefier',
      cover_url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&q=80',
      banner_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&q=80',
      synopsis: 'Earth is integrated into the boundless multiverse, and Zac finds himself stranded on an island full of demons.',
      status: 'releasing',
      format: 'WEB NOVEL',
      score: 9.3,
      total_units: 1200,
      genres: ['Action', 'Cultivation', 'LitRPG'],
      official_links: [
        { site: 'Royal Road', url: 'https://www.royalroad.com/fiction/24709/defiance-of-the-fall' },
        { site: 'Amazon', url: 'https://www.amazon.com/dp/B09168R6KM' }
      ],
      updated_at: new Date().toISOString(),
    },
    {
      id: 'wn-shadow-slave',
      source_type: 'webnovel',
      media_type: 'novel',
      slug: 'shadow-slave',
      title_primary: 'Shadow Slave',
      title_secondary: 'Guiltythree',
      cover_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80',
      banner_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=80',
      synopsis: 'Growing up in poverty, Sunny was never expected to amount to anything. But when selected by the Nightmare Spell, his fate changes forever.',
      status: 'releasing',
      format: 'WEB NOVEL',
      score: 9.7,
      total_units: 1750,
      genres: ['Dark Fantasy', 'Mystery', 'Supernatural'],
      official_links: [
        { site: 'Webnovel', url: 'https://www.webnovel.com/book/shadow-slave_22166657605769005' }
      ],
      updated_at: new Date().toISOString(),
    },
    {
      id: 'wn-lord-of-mysteries',
      source_type: 'webnovel',
      media_type: 'novel',
      slug: 'lord-of-mysteries',
      title_primary: 'Lord of the Mysteries',
      title_secondary: 'Cuttlefish That Loves Diving',
      cover_url: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?w=600&q=80',
      banner_url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80',
      synopsis: 'With the rising tide of steam power and machinery, who can come close to being a Beyonder? Shrouded in the fog of history and mystery.',
      status: 'completed',
      format: 'WEB NOVEL',
      score: 9.8,
      total_units: 1432,
      genres: ['Steampunk', 'Mystery', 'Fantasy'],
      official_links: [
        { site: 'Webnovel', url: 'https://www.webnovel.com/book/lord-of-mysteries_11036087005398705' }
      ],
      updated_at: new Date().toISOString(),
    },
    {
      id: 'wp-lore-olympus',
      source_type: 'webtoon',
      media_type: 'manhwa',
      slug: 'lore-olympus',
      title_primary: 'Lore Olympus',
      title_secondary: 'Rachel Smythe',
      cover_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&q=80',
      banner_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=80',
      synopsis: 'Witness what the gods do after dark in this stylish and romantic modern retelling of the taking of Persephone.',
      status: 'completed',
      format: 'WEBTOON',
      score: 8.9,
      total_units: 280,
      genres: ['Romance', 'Drama', 'Mythology'],
      official_links: [
        { site: 'WEBTOON', url: 'https://www.webtoons.com/en/romance/lore-olympus/list?title_no=1320' },
        { site: 'Wattpad', url: 'https://www.wattpad.com' }
      ],
      updated_at: new Date().toISOString(),
    },
    {
      id: 'rr-mother-of-learning',
      source_type: 'royalroad',
      media_type: 'novel',
      slug: 'mother-of-learning',
      title_primary: 'Mother of Learning',
      title_secondary: 'nobody103',
      cover_url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&q=80',
      banner_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&q=80',
      synopsis: 'Zorian is a teenage mage of humble birth and slightly above-average skill, thrown into a repeating month-long time loop.',
      status: 'completed',
      format: 'WEB NOVEL',
      score: 9.6,
      total_units: 108,
      genres: ['Fantasy', 'Time Loop', 'Mystery'],
      official_links: [
        { site: 'Royal Road', url: 'https://www.royalroad.com/fiction/21220/mother-of-learning' }
      ],
      updated_at: new Date().toISOString(),
    }
  ];

  const allRaw = [...generalMedia, ...novelMedia];
  const upsertRows = allRaw.map((item) => {
    const title = item.title?.english || item.title?.romaji || 'Untitled';
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
      synopsis: item.description ? item.description.replace(/<[^>]*>?/gm, '') : '',
      status: item.status?.toLowerCase() || 'releasing',
      format: item.format || 'UNKNOWN',
      score: item.averageScore ? Number((item.averageScore / 10).toFixed(1)) : null,
      total_units: item.episodes || item.chapters || 0,
      genres: Array.isArray(item.genres) ? item.genres : [],
      official_links: filterOfficialLinks(item.externalLinks),
      updated_at: new Date().toISOString(),
    };
  });

  const finalRows = [...globalCuratedWebNovels, ...upsertRows];

  const { error } = await supabase
    .from('media_catalog')
    .upsert(finalRows, { onConflict: 'id' });

  if (error) {
    console.error('[Omnidex] Supabase upsert error:', error.message);
  } else {
    console.log(`[Omnidex] Successfully indexed ${finalRows.length} titles across global platforms.`);
  }
}

runSync().catch(console.error);
