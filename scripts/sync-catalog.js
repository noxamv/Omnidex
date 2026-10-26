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
query ($page: Int, $perPage: Int, $type: MediaType, $format: MediaFormat, $sort: [MediaSort]) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      hasNextPage
      currentPage
    }
    media(type: $type, format: $format, sort: $sort) {
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
          'User-Agent': 'Omnidex-Legal-Media-Indexer/2.0',
        },
        body: JSON.stringify({ query: ANILIST_PAGE_QUERY, variables }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (res.status === 429) {
        console.warn(`[AniList 429 Rate Limit] Pausing 5s before retry (Attempt ${attempt}/${maxRetries})...`);
        await delay(5000);
        continue;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      return json.data?.Page?.media || [];
    } catch (err) {
      if (attempt === maxRetries) {
        console.error(`[AniList Request Failed] Variable state:`, variables, err.message);
        return [];
      }
      await delay(attempt * 1500);
    }
  }
  return [];
}

async function runGlobalIngestion() {
  console.log('=== Omnidex High-Throughput Catalog Harvester Online ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);

  let collected = [];

  // =========================================================================
  // BATCH 1: MANHWA & WEBTOONS (Korea Origin - High Priority)
  // Target: 20 Pages * 50 = 1,000 Trending/Top Manhwa
  // =========================================================================
  console.log('\n📥 Stage 1: Ingesting Korean Manhwa & Webtoons...');
  for (let p = 1; p <= 20; p++) {
    process.stdout.write(`  -> Fetching Manhwa Page ${p}/20... `);
    const pageItems = await fetchAniListPageWithRetry({
      page: p,
      perPage: 50,
      type: 'MANGA',
      format: 'MANHWA',
      sort: ['POPULARITY_DESC'],
    });
    console.log(`[+${pageItems.length} items]`);
    if (!pageItems.length) break;
    collected.push(...pageItems);
    await delay(750); // Respects 90 req/min limit
  }

  // =========================================================================
  // BATCH 2: JAPANESE MANGA (Shonen, Seinen, Shoujo, Josei)
  // Target: 25 Pages * 50 = 1,250 Trending Japanese Manga
  // =========================================================================
  console.log('\n📥 Stage 2: Ingesting Japanese Manga Catalog...');
  for (let p = 1; p <= 25; p++) {
    process.stdout.write(`  -> Fetching Manga Page ${p}/25... `);
    const pageItems = await fetchAniListPageWithRetry({
      page: p,
      perPage: 50,
      type: 'MANGA',
      format: 'MANGA',
      sort: ['POPULARITY_DESC'],
    });
    console.log(`[+${pageItems.length} items]`);
    if (!pageItems.length) break;
    collected.push(...pageItems);
    await delay(750);
  }

  // =========================================================================
  // BATCH 3: LIGHT NOVELS & WEB NOVELS (Syosetu, Kakuyomu, Royal Road, Qidian)
  // Target: 20 Pages * 50 = 1,000 Global Web & Light Novels
  // =========================================================================
  console.log('\n📥 Stage 3: Ingesting Light Novels & Web Fiction...');
  for (let p = 1; p <= 20; p++) {
    process.stdout.write(`  -> Fetching Novels Page ${p}/20... `);
    const pageItems = await fetchAniListPageWithRetry({
      page: p,
      perPage: 50,
      type: 'MANGA',
      format: 'NOVEL',
      sort: ['POPULARITY_DESC'],
    });
    console.log(`[+${pageItems.length} items]`);
    if (!pageItems.length) break;
    collected.push(...pageItems);
    await delay(750);
  }

  // =========================================================================
  // BATCH 4: ANIME SIMULCASTS & POPULAR SEASONS
  // Target: 20 Pages * 50 = 1,000 Anime Series
  // =========================================================================
  console.log('\n📥 Stage 4: Ingesting Anime Series Catalog...');
  for (let p = 1; p <= 20; p++) {
    process.stdout.write(`  -> Fetching Anime Page ${p}/20... `);
    const pageItems = await fetchAniListPageWithRetry({
      page: p,
      perPage: 50,
      type: 'ANIME',
      sort: ['POPULARITY_DESC'],
    });
    console.log(`[+${pageItems.length} items]`);
    if (!pageItems.length) break;
    collected.push(...pageItems);
    await delay(750);
  }

  console.log(`\n📦 Raw Media Harvested: ${collected.length} total entries.`);

  // =========================================================================
  // DATA TRANSFORMATION & GLOBAL DEDUPLICATION
  // =========================================================================
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
      status: item.status?.toLowerCase() || 'releasing',
      format: item.format || null,
      score: item.averageScore ? parseFloat((item.averageScore / 10).toFixed(1)) : null,
      total_units: item.episodes || item.chapters || 0,
      genres: Array.isArray(item.genres) ? item.genres : [],
      official_links: extractOfficialLinks(item.externalLinks),
      updated_at: new Date().toISOString(),
    };
  });

  // Deduplicate rows by distinct ID
  const uniqueCatalog = Array.from(new Map(transformedRows.map((r) => [r.id, r])).values());
  console.log(`✨ Deduplicated to ${uniqueCatalog.length} unique catalog records.`);

  // =========================================================================
  // CHUNKED DATABASE UPSERT (500 Rows/Batch - Avoids PostgREST Payload Limits)
  // =========================================================================
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
