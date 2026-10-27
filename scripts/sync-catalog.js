// scripts/sync-catalog.js
import { createClient } from '@supabase/supabase-js';
import { extractOfficialLinks } from './lib/official-sources.js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[Omnidex Harvester] Missing Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const ANILIST_GRAPHQL_ENDPOINT = 'https://graphql.anilist.co';

const ANILIST_PAGE_QUERY = `
query ($page: Int, $perPage: Int, $type: MediaType, $format: MediaFormat, $countryOfOrigin: CountryCode, $sort: [MediaSort]) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      hasNextPage
      currentPage
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
      synonyms
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

function normalizeStatus(rawStatus) {
  if (!rawStatus) return 'releasing';
  const lower = rawStatus.toLowerCase();
  if (lower === 'completed') return 'finished';
  return lower;
}

function sanitizeSynopsis(desc) {
  if (!desc) return null;
  return desc
    .replace(/<[^>]*>/g, '')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

async function fetchAniListPageWithRetry(variables, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Omnidex-Legal-Media-Indexer/3.0',
        },
        body: JSON.stringify({ query: ANILIST_PAGE_QUERY, variables }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (res.status === 429) {
        console.warn(`[AniList 429 Rate Limit] Pacing triggered. Pausing 10s before retry (Attempt ${attempt}/${maxRetries})...`);
        await delay(10000);
        continue;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

      const json = await res.json();
      return json.data?.Page?.media || [];
    } catch (err) {
      if (attempt === maxRetries) {
        console.error(`[AniList Request Failed] Variable state:`, variables, err.message);
        return [];
      }
      await delay(attempt * 2500);
    }
  }
  return [];
}

async function runGlobalIngestion() {
  console.log('=== Omnidex High-Throughput Catalog Harvester (Multi-Sort Mode) ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);

  // DYNAMIC SORT ROTATION:
  // Rotates sort order every hour so the scraper continuously harvests NEW back-catalog series
  const currentHour = new Date().getUTCHours();
  const sortOptions = [
    ['POPULARITY_DESC'],
    ['TRENDING_DESC'],
    ['UPDATED_AT_DESC'],
    ['START_DATE_DESC'],
    ['FAVOURITES_DESC']
  ];
  const activeSort = sortOptions[currentHour % sortOptions.length];
  console.log(`🔄 Active Ingestion Sort Strategy: [${activeSort.join(', ')}]`);

  let collected = [];

  // Stage 1: Korean Manhwa (KR Origin)
  console.log('\n📥 Stage 1: Ingesting Korean Manhwa (KR)...');
  for (let p = 1; p <= 25; p++) {
    process.stdout.write(`  -> Fetching Manhwa Page ${p}/25... `);
    const pageItems = await fetchAniListPageWithRetry({
      page: p,
      perPage: 50,
      type: 'MANGA',
      countryOfOrigin: 'KR',
      sort: activeSort,
    });
    console.log(`[+${pageItems.length} items]`);
    if (!pageItems.length) break;
    collected.push(...pageItems);
    await delay(1000);
  }

  console.log('⏳ Cooldown 5.5s to drain AniList rolling rate limit bucket...');
  await delay(5500);

  // Stage 2: Chinese Manhua (CN Origin)
  console.log('\n📥 Stage 2: Ingesting Chinese Manhua (CN)...');
  for (let p = 1; p <= 20; p++) {
    process.stdout.write(`  -> Fetching Manhua Page ${p}/20... `);
    const pageItems = await fetchAniListPageWithRetry({
      page: p,
      perPage: 50,
      type: 'MANGA',
      countryOfOrigin: 'CN',
      sort: activeSort,
    });
    console.log(`[+${pageItems.length} items]`);
    if (!pageItems.length) break;
    collected.push(...pageItems);
    await delay(1000);
  }

  console.log('⏳ Cooldown 5.5s to drain AniList rolling rate limit bucket...');
  await delay(5500);

  // Stage 3: Japanese Manga (JP Origin)
  console.log('\n📥 Stage 3: Ingesting Japanese Manga (JP)...');
  for (let p = 1; p <= 25; p++) {
    process.stdout.write(`  -> Fetching Manga Page ${p}/25... `);
    const pageItems = await fetchAniListPageWithRetry({
      page: p,
      perPage: 50,
      type: 'MANGA',
      format: 'MANGA',
      countryOfOrigin: 'JP',
      sort: activeSort,
    });
    console.log(`[+${pageItems.length} items]`);
    if (!pageItems.length) break;
    collected.push(...pageItems);
    await delay(1000);
  }

  console.log('⏳ Cooldown 5.5s to drain AniList rolling rate limit bucket...');
  await delay(5500);

  // Stage 4: Light Novels & Web Novels
  console.log('\n📥 Stage 4: Ingesting Novels...');
  for (let p = 1; p <= 20; p++) {
    process.stdout.write(`  -> Fetching Novels Page ${p}/20... `);
    const pageItems = await fetchAniListPageWithRetry({
      page: p,
      perPage: 50,
      type: 'MANGA',
      format: 'NOVEL',
      sort: activeSort,
    });
    console.log(`[+${pageItems.length} items]`);
    if (!pageItems.length) break;
    collected.push(...pageItems);
    await delay(1000);
  }

  console.log('⏳ Cooldown 5.5s to drain AniList rolling rate limit bucket...');
  await delay(5500);

  // Stage 5: Anime Series & Simulcasts
  console.log('\n📥 Stage 5: Ingesting Anime Series...');
  for (let p = 1; p <= 25; p++) {
    process.stdout.write(`  -> Fetching Anime Page ${p}/25... `);
    const pageItems = await fetchAniListPageWithRetry({
      page: p,
      perPage: 50,
      type: 'ANIME',
      sort: activeSort,
    });
    console.log(`[+${pageItems.length} items]`);
    if (!pageItems.length) break;
    collected.push(...pageItems);
    await delay(1000);
  }

  console.log(`\n📦 Raw Media Harvested: ${collected.length} total entries.`);

  const transformedRows = collected.map((item) => {
    const primaryTitle =
      item.title?.english ||
      item.title?.romaji ||
      item.title?.native ||
      'Untitled Series';

    const safeSlugBase = primaryTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const compositeSlug = `${safeSlugBase || 'series'}-${item.id}`;

    return {
      id: `al-${item.id}`,
      source_type: 'anilist',
      media_type: determineMediaType(item),
      slug: compositeSlug,
      title_primary: primaryTitle,
      title_secondary: item.title?.romaji || item.title?.native || null,
      cover_url: item.coverImage?.extraLarge || item.coverImage?.large || null,
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

  const uniqueCatalog = Array.from(new Map(transformedRows.map((r) => [r.id, r])).values());
  console.log(`✨ Deduplicated to ${uniqueCatalog.length} unique catalog records.`);

  const CHUNK_SIZE = 500;
  let savedCount = 0;

  for (let i = 0; i < uniqueCatalog.length; i += CHUNK_SIZE) {
    const chunk = uniqueCatalog.slice(i, i + CHUNK_SIZE);
    process.stdout.write(`💾 Upserting chunk [${i + 1} - ${i + chunk.length}] to Supabase... `);

    const { error } = await supabase.from('media_catalog').upsert(chunk, {
      onConflict: 'id',
    });

    if (error) {
      console.error(`\n❌ Error on chunk offset ${i}:`, error.message);
    } else {
      savedCount += chunk.length;
      console.log('✅ Done');
    }
  }

  console.log(`\n🎉 Ingestion Pass Complete! Total Series Synchronized: ${savedCount}`);
}

runGlobalIngestion().catch((err) => {
  console.error('[Fatal Ingestion Failure]', err);
  process.exit(1);
});
