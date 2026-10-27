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

// Source API Endpoints
const ANILIST_ENDPOINT = 'https://graphql.anilist.co';
const MANGADEX_ENDPOINT = 'https://api.mangadex.org';
const KITSU_ENDPOINT = 'https://kitsu.io/api/edge';

// Verified Canonical Covers for Web/Light Novels
const CANONICAL_NOVEL_COVERS = {
  'lord of the mysteries': 'https://upload.wikimedia.org/wikipedia/en/b/b6/Lord_of_the_Mysteries_Volume_1.jpg',
  'shadow slave': 'https://static.wikia.nocookie.net/shadow-slave/images/5/5f/Shadow_Slave_Cover.jpg',
  'mother of learning': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1637779836i/59661342.jpg',
  'the primal hunter': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1647466547i/60655822.jpg',
  'defiance of the fall': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1628107567i/57999863.jpg',
  'reverend insanity': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx110682-1jRjWv3i6C1X.jpg',
  'coiling dragon': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85403-sO7760rE33o4.jpg',
  'the beginning after the end': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx108343-s5e89wO0mK1m.jpg',
  'trash of the counts family': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx112217-v4B44k1a7V1C.jpg',
};

// Normalization Helper for Title Comparison
function normalizeTitle(raw) {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function normalizeSlug(raw) {
  if (!raw) return 'series';
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function resolveNovelCover(title, fallback) {
  const lower = (title || '').toLowerCase();
  for (const [key, url] of Object.entries(CANONICAL_NOVEL_COVERS)) {
    if (lower.includes(key)) return url;
  }
  return fallback;
}

// Global In-Memory Fingerprint Set (Tracks title + media_type pairs)
const seenFingerprints = new Set();
const seenIds = new Set();

function isDuplicate(title, mediaType) {
  const norm = normalizeTitle(title);
  if (!norm) return true;
  const key = `${norm}:::${mediaType.toLowerCase()}`;
  return seenFingerprints.has(key);
}

function registerFingerprint(title, mediaType, id) {
  const norm = normalizeTitle(title);
  if (norm) {
    seenFingerprints.add(`${norm}:::${mediaType.toLowerCase()}`);
  }
  if (id) {
    seenIds.add(id);
  }
}

// ==============================================================================
// 1. MANGADEX INGESTION (Manga, Manhwa, Manhua with Official Covers)
// ==============================================================================
async function fetchMangaDexBatch(limit = 100, offset = 0) {
  try {
    const url = `${MANGADEX_ENDPOINT}/manga?limit=${limit}&offset=${offset}&includes[]=cover_art&order[followedCount]=desc&contentRating[]=safe&contentRating[]=suggestive`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Omnidex-Catalog-Sync/4.0' } });
    if (!res.ok) return [];
    const json = await res.json();
    const data = json.data || [];

    const results = [];
    for (const item of data) {
      const title = item.attributes?.title?.en || Object.values(item.attributes?.title || {})[0] || '';
      const origLang = item.attributes?.originalLanguage;

      let mediaType = 'manga';
      if (origLang === 'ko') mediaType = 'manhwa';
      else if (origLang === 'zh' || origLang === 'zh-hk') mediaType = 'manhua';

      // Skip if already in database or collected earlier in this run
      if (isDuplicate(title, mediaType) || seenIds.has(`md-${item.id}`)) {
        continue;
      }

      const coverRel = item.relationships?.find((r) => r.type === 'cover_art');
      const fileName = coverRel?.attributes?.fileName;
      const coverUrl = fileName ? `https://uploads.mangadex.org/covers/${item.id}/${fileName}.512.jpg` : null;

      registerFingerprint(title, mediaType, `md-${item.id}`);

      results.push({
        id: `md-${item.id}`,
        source_type: 'mangadex',
        media_type: mediaType,
        slug: `${normalizeSlug(title)}-${item.id.slice(0, 8)}`,
        title_primary: title,
        title_secondary: item.attributes?.altTitles?.find((t) => t.ja || t.ko || t.zh)?.ja || null,
        cover_url: coverUrl,
        banner_url: null,
        synopsis: item.attributes?.description?.en || null,
        status: item.attributes?.status === 'completed' ? 'finished' : 'releasing',
        format: mediaType.toUpperCase(),
        score: null,
        total_units: item.attributes?.lastChapter ? parseInt(item.attributes.lastChapter) || 0 : 0,
        genres: (item.attributes?.tags || []).map((t) => t.attributes?.name?.en).filter(Boolean),
        official_links: [{ site: 'MangaDex', url: `https://mangadex.org/title/${item.id}` }],
        updated_at: new Date().toISOString(),
      });
    }
    return results;
  } catch (err) {
    console.warn('[MangaDex Warning]', err.message);
    return [];
  }
}

// ==============================================================================
// 2. KITSU INGESTION (Anime & Missing Adaptations)
// ==============================================================================
async function fetchKitsuBatch(type = 'anime', limit = 20, offset = 0) {
  try {
    const url = `${KITSU_ENDPOINT}/${type}?page[limit]=${limit}&page[offset]=${offset}&sort=-userCount`;
    const res = await fetch(url, { headers: { 'Accept': 'application/vnd.api+json' } });
    if (!res.ok) return [];
    const json = await res.json();
    const data = json.data || [];

    const results = [];
    for (const item of data) {
      const attr = item.attributes || {};
      const title = attr.canonicalTitle || attr.titles?.en || attr.titles?.en_jp || '';
      const mediaType = type === 'anime' ? 'anime' : (attr.subtype === 'manhwa' ? 'manhwa' : 'manga');

      // Skip duplicate in same format (e.g. Lookism Anime will NOT be skipped if Lookism Manhwa exists)
      if (isDuplicate(title, mediaType) || seenIds.has(`kt-${item.id}`)) {
        continue;
      }

      registerFingerprint(title, mediaType, `kt-${item.id}`);

      results.push({
        id: `kt-${item.id}`,
        source_type: 'kitsu',
        media_type: mediaType,
        slug: `${normalizeSlug(title)}-kt-${item.id}`,
        title_primary: title,
        title_secondary: attr.titles?.ja_jp || null,
        cover_url: attr.posterImage?.large || attr.posterImage?.original || null,
        banner_url: attr.coverImage?.large || null,
        synopsis: attr.synopsis || null,
        status: attr.status === 'finished' ? 'finished' : 'releasing',
        format: attr.subtype?.toUpperCase() || type.toUpperCase(),
        score: attr.averageRating ? parseFloat((parseFloat(attr.averageRating) / 10).toFixed(1)) : null,
        total_units: attr.episodeCount || attr.chapterCount || 0,
        genres: [],
        official_links: [{ site: 'Kitsu', url: `https://kitsu.io/${type}/${attr.slug || item.id}` }],
        updated_at: new Date().toISOString(),
      });
    }
    return results;
  } catch (err) {
    console.warn('[Kitsu Warning]', err.message);
    return [];
  }
}

// ==============================================================================
// 3. ANILIST INGESTION (Web/Light Novels & Core Backfill)
// ==============================================================================
const ANILIST_PAGE_QUERY = `
query ($page: Int, $perPage: Int, $type: MediaType, $format: MediaFormat, $countryOfOrigin: CountryCode, $sort: [MediaSort]) {
  Page(page: $page, perPage: $perPage) {
    media(type: $type, format: $format, countryOfOrigin: $countryOfOrigin, sort: $sort) {
      id
      type
      format
      title { english romaji native }
      coverImage { extraLarge large }
      bannerImage
      description(asHtml: false)
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

async function fetchAniListBatch(variables) {
  try {
    const res = await fetch(ANILIST_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query: ANILIST_PAGE_QUERY, variables }),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data?.Page?.media || [];
  } catch {
    return [];
  }
}

// ==============================================================================
// MAIN DEDUPLICATED INGESTION PIPELINE
// ==============================================================================
async function runDeduplicatedIngestion() {
  console.log('=== Omnidex Deduplicated Multi-Source Harvester Online ===');
  console.log(`Execution Timestamp: ${new Date().toISOString()}`);

  // 1. Preload existing database fingerprints into memory
  console.log('\n🔍 Preloading catalog index to avoid duplicate requests...');
  let hasMore = true;
  let offset = 0;
  const PAGE_SIZE = 1000;

  while (hasMore) {
    const { data: existing, error } = await supabase
      .from('media_catalog')
      .select('id, title_primary, media_type')
      .range(offset, offset + PAGE_SIZE - 1);

    if (error || !existing || existing.length === 0) {
      hasMore = false;
      break;
    }

    for (const row of existing) {
      registerFingerprint(row.title_primary, row.media_type, row.id);
    }

    offset += PAGE_SIZE;
    if (existing.length < PAGE_SIZE) hasMore = false;
  }

  console.log(`✅ Loaded ${seenFingerprints.size} existing (title + medium) fingerprints.`);

  // 2. Compute dynamic page offset based on hour to crawl deeper
  const hour = new Date().getUTCHours();
  const pageOffset = (hour * 4) % 40; // Cycles deeper through pages 0 to 40
  console.log(`📄 Dynamic Page Window Start Offset: ${pageOffset}`);

  const newlyCollected = [];

  // STAGE 1: MangaDex (Fetch new Manhwa, Manhua & Manga not yet in DB)
  console.log('\n📥 Stage 1: Ingesting fresh titles from MangaDex API...');
  for (let p = 0; p < 4; p++) {
    const curOffset = (pageOffset * 100) + (p * 100);
    process.stdout.write(`  -> MangaDex offset ${curOffset}... `);
    const batch = await fetchMangaDexBatch(100, curOffset);
    console.log(`[+${batch.length} new unique titles]`);
    newlyCollected.push(...batch);
    await delay(1200);
  }

  // STAGE 2: Kitsu Anime (Pulls Lookism, Solo Leveling Anime adaptations)
  console.log('\n📥 Stage 2: Ingesting anime adaptations from Kitsu API...');
  for (let p = 0; p < 5; p++) {
    const curOffset = (pageOffset * 20) + (p * 20);
    process.stdout.write(`  -> Kitsu Anime offset ${curOffset}... `);
    const batch = await fetchKitsuBatch('anime', 20, curOffset);
    console.log(`[+${batch.length} new unique anime]`);
    newlyCollected.push(...batch);
    await delay(600);
  }

  // STAGE 3: AniList Novels (Fills in light & web novels)
  console.log('\n📥 Stage 3: Ingesting novels from AniList GraphQL...');
  for (let p = 1; p <= 8; p++) {
    const pageNum = pageOffset + p;
    process.stdout.write(`  -> AniList Novels Page ${pageNum}... `);
    const alNovels = await fetchAniListBatch({
      page: pageNum,
      perPage: 50,
      type: 'MANGA',
      format: 'NOVEL',
      sort: ['POPULARITY_DESC'],
    });

    let novelCount = 0;
    for (const item of alNovels) {
      const primaryTitle = item.title?.english || item.title?.romaji || item.title?.native || '';
      
      // Skip duplicate in same format
      if (isDuplicate(primaryTitle, 'novel') || seenIds.has(`al-${item.id}`)) {
        continue;
      }

      registerFingerprint(primaryTitle, 'novel', `al-${item.id}`);

      const cover = resolveNovelCover(primaryTitle, item.coverImage?.extraLarge || item.coverImage?.large);
      newlyCollected.push({
        id: `al-${item.id}`,
        source_type: 'anilist',
        media_type: 'novel',
        slug: `${normalizeSlug(primaryTitle)}-${item.id}`,
        title_primary: primaryTitle,
        title_secondary: item.title?.romaji || item.title?.native || null,
        cover_url: cover,
        banner_url: item.bannerImage || null,
        synopsis: item.description?.replace(/<[^>]*>/g, '')?.trim() || null,
        status: item.status?.toLowerCase() === 'completed' ? 'finished' : 'releasing',
        format: 'NOVEL',
        score: item.averageScore ? parseFloat((item.averageScore / 10).toFixed(1)) : null,
        total_units: item.chapters || 0,
        genres: item.genres || [],
        official_links: extractOfficialLinks(item.externalLinks),
        updated_at: new Date().toISOString(),
      });
      novelCount++;
    }
    console.log(`[+${novelCount} new unique novels]`);
    await delay(1000);
  }

  console.log(`\n📦 Total New Unique Media Found: ${newlyCollected.length}`);

  if (newlyCollected.length === 0) {
    console.log('✨ All queried titles already exist in your database. Zero redundant writes performed.');
    return;
  }

  // 4. Batch upsert only genuinely new titles
  const CHUNK_SIZE = 500;
  let savedCount = 0;
  for (let i = 0; i < newlyCollected.length; i += CHUNK_SIZE) {
    const chunk = newlyCollected.slice(i, i + CHUNK_SIZE);
    process.stdout.write(`💾 Saving new batch [${i + 1} - ${i + chunk.length}] to Supabase... `);
    const { error } = await supabase.from('media_catalog').upsert(chunk, { onConflict: 'id' });
    if (!error) {
      savedCount += chunk.length;
      console.log('✅ Done');
    } else {
      console.error('❌ Error:', error.message);
    }
  }

  console.log(`\n🎉 Ingestion Finished! Successfully added ${savedCount} fresh titles.`);
}

runDeduplicatedIngestion().catch((err) => {
  console.error('[Fatal Ingestion Failure]', err);
  process.exit(1);
});
