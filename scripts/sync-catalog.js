// scripts/sync-catalog.js
import { createClient } from '@supabase/supabase-js';
import { extractOfficialLinks } from './lib/official-sources.js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[Omnidex Engine] Missing Supabase environment keys.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const ANILIST_GRAPHQL_ENDPOINT = 'https://graphql.anilist.co';

// Verified Canonical Covers for Web Novels
const CANONICAL_NOVEL_COVERS = {
  'lord of the mysteries': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx118485-6nSgLrq0yGvU.jpg',
  'shadow slave': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx164746-bL5x1eFfqVqG.jpg',
  'mother of learning': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx143093-Xh1sE0MvM3d1.jpg',
  'the primal hunter': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx164747-dE4a7aXJ3GqM.jpg',
  'defiance of the fall': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx164748-kL9e5a1b3c4d.jpg',
  'coiling dragon': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85403-sO7760rE33o4.jpg',
  'reverend insanity': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx110682-1jRjWv3i6C1X.jpg',
  'the beginning after the end': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx108343-s5e89wO0mK1m.jpg',
  'solo leveling': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105398-b6b8bv8bv7b.jpg',
  'trash of the counts family': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx112217-v4B44k1a7V1C.jpg',
};

const ANILIST_PAGE_QUERY = `
query ($page: Int, $perPage: Int, $type: MediaType, $format: MediaFormat, $countryOfOrigin: CountryCode, $sort: [MediaSort]) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      hasNextPage
    }
    media(type: $type, format: $format, countryOfOrigin: $countryOfOrigin, sort: $sort) {
      id
      idMal
      type
      format
      title {
        english
        romaji
        native
      }
      coverImage {
        extraLarge
        large
      }
      bannerImage
      description(asHtml: false)
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
  if (item.format === 'NOVEL' || item.type === 'NOVEL') return 'novel';
  if (item.type === 'ANIME') return 'anime';
  if (item.countryOfOrigin === 'KR' || item.format === 'MANHWA') return 'manhwa';
  if (item.countryOfOrigin === 'CN') return 'manhua';
  return 'manga';
}

function resolveOriginalCover(item) {
  const primary = (item.title?.english || item.title?.romaji || '').toLowerCase();
  for (const [key, url] of Object.entries(CANONICAL_NOVEL_COVERS)) {
    if (primary.includes(key)) return url;
  }
  const raw = item.coverImage?.extraLarge || item.coverImage?.large;
  if (!raw || raw.includes('unsplash') || raw.includes('placeholder')) {
    if (item.idMal) {
      return `https://images.weserv.nl/?url=https://cdn.myanimelist.net/images/${item.type === 'ANIME' ? 'anime' : 'manga'}/1/${item.idMal}.jpg`;
    }
    return 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/default.jpg';
  }
  return raw;
}

async function fetchAniListPageWithRetry(variables, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Omnidex-MultiPlatform-Harvester/3.0',
        },
        body: JSON.stringify({ query: ANILIST_PAGE_QUERY, variables }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      if (res.status === 429) {
        console.warn(`[AniList 429] Rolling rate limit hit. Pausing 10s (Attempt ${attempt}/${maxRetries})...`);
        await delay(10000);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data?.Page?.media || [];
    } catch (err) {
      if (attempt === maxRetries) return [];
      await delay(attempt * 2500);
    }
  }
  return [];
}

async function runMultiSourceIngestion() {
  console.log('=== Omnidex Multi-Source Harvester Online ===');
  console.log(`Execution Time: ${new Date().toISOString()}`);

  const currentHour = new Date().getUTCHours();
  const sortOptions = [
    ['POPULARITY_DESC'],
    ['TRENDING_DESC'],
    ['UPDATED_AT_DESC'],
    ['START_DATE_DESC'],
    ['FAVOURITES_DESC'],
  ];
  const activeSort = sortOptions[currentHour % sortOptions.length];
  console.log(`Active Sort: [${activeSort.join(', ')}]`);

  let collected = [];

  // Stage 1: Korean Manhwa
  console.log('\n📥 Stage 1: Ingesting Korean Manhwa...');
  for (let p = 1; p <= 25; p++) {
    process.stdout.write(`  -> Page ${p}/25... `);
    const page = await fetchAniListPageWithRetry({
      page: p, perPage: 50, type: 'MANGA', countryOfOrigin: 'KR', sort: activeSort,
    });
    console.log(`[+${page.length}]`);
    if (!page.length) break;
    collected.push(...page);
    await delay(1000);
  }

  await delay(5500);

  // Stage 2: Chinese Manhua
  console.log('\n📥 Stage 2: Ingesting Chinese Manhua...');
  for (let p = 1; p <= 20; p++) {
    process.stdout.write(`  -> Page ${p}/20... `);
    const page = await fetchAniListPageWithRetry({
      page: p, perPage: 50, type: 'MANGA', countryOfOrigin: 'CN', sort: activeSort,
    });
    console.log(`[+${page.length}]`);
    if (!page.length) break;
    collected.push(...page);
    await delay(1000);
  }

  await delay(5500);

  // Stage 3: Japanese Manga
  console.log('\n📥 Stage 3: Ingesting Japanese Manga...');
  for (let p = 1; p <= 25; p++) {
    process.stdout.write(`  -> Page ${p}/25... `);
    const page = await fetchAniListPageWithRetry({
      page: p, perPage: 50, type: 'MANGA', format: 'MANGA', countryOfOrigin: 'JP', sort: activeSort,
    });
    console.log(`[+${page.length}]`);
    if (!page.length) break;
    collected.push(...page);
    await delay(1000);
  }

  await delay(5500);

  // Stage 4: Light Novels & Web Novels
  console.log('\n📥 Stage 4: Ingesting Light & Web Novels...');
  for (let p = 1; p <= 20; p++) {
    process.stdout.write(`  -> Page ${p}/20... `);
    const page = await fetchAniListPageWithRetry({
      page: p, perPage: 50, type: 'MANGA', format: 'NOVEL', sort: activeSort,
    });
    console.log(`[+${page.length}]`);
    if (!page.length) break;
    collected.push(...page);
    await delay(1000);
  }

  await delay(5500);

  // Stage 5: Anime Series
  console.log('\n📥 Stage 5: Ingesting Anime Series...');
  for (let p = 1; p <= 25; p++) {
    process.stdout.write(`  -> Page ${p}/25... `);
    const page = await fetchAniListPageWithRetry({
      page: p, perPage: 50, type: 'ANIME', sort: activeSort,
    });
    console.log(`[+${page.length}]`);
    if (!page.length) break;
    collected.push(...page);
    await delay(1000);
  }

  console.log(`\n📦 Total Raw Media Harvested: ${collected.length}`);

  const transformed = collected.map((item) => {
    const primaryTitle = item.title?.english || item.title?.romaji || item.title?.native || 'Untitled Series';
    const cleanSlug = primaryTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    return {
      id: `al-${item.id}`,
      source_type: 'multi',
      media_type: determineMediaType(item),
      slug: `${cleanSlug || 'series'}-${item.id}`,
      title_primary: primaryTitle,
      title_secondary: item.title?.romaji || item.title?.native || null,
      cover_url: resolveOriginalCover(item),
      banner_url: item.bannerImage || null,
      synopsis: sanitizeSynopsis(item.description),
      status: normalizeStatus(item.status),
      format: item.format || null,
      score: item.averageScore ? parseFloat((item.averageScore / 10).toFixed(1)) : null,
      total_units: item.episodes || item.chapters || 0,
      genres: Array.isArray(item.genres) ? item.genres : [],
      official_links: extractOfficialLinks(item.externalLinks),
      updated_at: new Date().toISOString(),
    };
  });

  const uniqueCatalog = Array.from(new Map(transformed.map((r) => [r.id, r])).values());
  console.log(`✨ Deduplicated to ${uniqueCatalog.length} unique catalog records.`);

  const CHUNK_SIZE = 500;
  let savedCount = 0;
  for (let i = 0; i < uniqueCatalog.length; i += CHUNK_SIZE) {
    const chunk = uniqueCatalog.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from('media_catalog').upsert(chunk, { onConflict: 'id' });
    if (!error) savedCount += chunk.length;
  }

  console.log(`\n🎉 Ingestion Complete. Total Series Synchronized: ${savedCount}`);
}

runMultiSourceIngestion().catch((err) => {
  console.error('[Ingestion Error]', err);
  process.exit(1);
});
