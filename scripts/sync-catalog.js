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

// Wrap external image through our unblocked Next.js proxy route
function proxyUrl(targetUrl) {
  if (!targetUrl) return null;
  if (targetUrl.startsWith('/api/proxy')) return targetUrl;
  return `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
}

// Verified Canonical Covers for Web & Light Novels (Routed through internal proxy)
const CANONICAL_NOVEL_COVERS = {
  'lord of the mysteries': proxyUrl('https://upload.wikimedia.org/wikipedia/en/b/b6/Lord_of_the_Mysteries_Volume_1.jpg'),
  'shadow slave': proxyUrl('https://m.media-amazon.com/images/I/71K8pXpB7WL._AC_UF1000,1000_QL80_.jpg'),
  'mother of learning': proxyUrl('https://m.media-amazon.com/images/I/81bSwgWvHUL._AC_UF1000,1000_QL80_.jpg'),
  'the primal hunter': proxyUrl('https://m.media-amazon.com/images/I/81k4B7aGzAL._AC_UF1000,1000_QL80_.jpg'),
  'defiance of the fall': proxyUrl('https://m.media-amazon.com/images/I/81b21Fz9V0L._AC_UF1000,1000_QL80_.jpg'),
  'reverend insanity': proxyUrl('https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx110682-1jRjWv3i6C1X.jpg'),
  'coiling dragon': proxyUrl('https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85403-sO7760rE33o4.jpg'),
  'the beginning after the end': proxyUrl('https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx108343-s5e89wO0mK1m.jpg'),
  'trash of the counts family': proxyUrl('https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx112217-v4B44k1a7V1C.jpg'),
};

// Normalization Helpers
function normalizeTitle(raw) {
  if (!raw) return '';
  return raw.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

function normalizeSlug(raw) {
  if (!raw) return 'series';
  return raw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function resolveNovelCover(title, fallback) {
  const lower = (title || '').toLowerCase();
  for (const [key, url] of Object.entries(CANONICAL_NOVEL_COVERS)) {
    if (lower.includes(key)) return url;
  }
  return fallback ? proxyUrl(fallback) : null;
}

function isBadCover(url) {
  if (!url || typeof url !== 'string') return true;
  const clean = url.trim().toLowerCase();
  return (
    clean === '' ||
    clean.includes('unsplash') ||
    clean.includes('placeholder') ||
    clean.includes('default.jpg') ||
    clean.includes('no-image')
  );
}

// In-Memory Catalog Tracking Sets
const healthyFingerprints = new Set();
const brokenCoverFingerprints = new Set();
const seenIds = new Set();

function shouldProcessItem(title, mediaType) {
  const norm = normalizeTitle(title);
  if (!norm) return false;
  const key = `${norm}:::${mediaType.toLowerCase()}`;

  // If already healthy in database, skip it to save quota
  if (healthyFingerprints.has(key)) {
    return false;
  }

  // If totally unseen OR currently marked with a broken cover, process it!
  return true;
}

function markProcessed(title, mediaType, id, hasGoodCover) {
  const norm = normalizeTitle(title);
  const key = `${norm}:::${mediaType.toLowerCase()}`;
  if (hasGoodCover) {
    healthyFingerprints.add(key);
    brokenCoverFingerprints.delete(key);
  } else {
    brokenCoverFingerprints.add(key);
  }
  if (id) seenIds.add(id);
}

// ==============================================================================
// 1. MANGADEX INGESTION ENGINE (Official Volume Covers)
// ==============================================================================
async function fetchMangaDexBatch(limit = 100, offset = 0) {
  try {
    const url = `${MANGADEX_ENDPOINT}/manga?limit=${limit}&offset=${offset}&includes[]=cover_art&order[followedCount]=desc&contentRating[]=safe&contentRating[]=suggestive`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Omnidex-Catalog-Sync/5.0' } });
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

      if (!shouldProcessItem(title, mediaType)) {
        continue;
      }

      const coverRel = item.relationships?.find((r) => r.type === 'cover_art');
      const fileName = coverRel?.attributes?.fileName;
      const rawCover = fileName ? `https://uploads.mangadex.org/covers/${item.id}/${fileName}.512.jpg` : null;
      const coverUrl = rawCover ? proxyUrl(rawCover) : null;

      markProcessed(title, mediaType, `md-${item.id}`, !isBadCover(coverUrl));

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
    console.warn('[MangaDex Fetch Warning]', err.message);
    return [];
  }
}

// ==============================================================================
// 2. KITSU INGESTION ENGINE (Anime & Adaptations)
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

      if (!shouldProcessItem(title, mediaType)) {
        continue;
      }

      const rawCover = attr.posterImage?.large || attr.posterImage?.original || null;
      const coverUrl = rawCover ? proxyUrl(rawCover) : null;

      markProcessed(title, mediaType, `kt-${item.id}`, !isBadCover(coverUrl));

      results.push({
        id: `kt-${item.id}`,
        source_type: 'kitsu',
        media_type: mediaType,
        slug: `${normalizeSlug(title)}-kt-${item.id}`,
        title_primary: title,
        title_secondary: attr.titles?.ja_jp || null,
        cover_url: coverUrl,
        banner_url: attr.coverImage?.large ? proxyUrl(attr.coverImage.large) : null,
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
    console.warn('[Kitsu Fetch Warning]', err.message);
    return [];
  }
}

// ==============================================================================
// 3. ANILIST INGESTION ENGINE (Web & Light Novels + Core Catalog)
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
// MAIN DEDUPLICATED & SELF-HEALING HARVESTER
// ==============================================================================
async function runSelfHealingIngestion() {
  console.log('=== Omnidex Deduplicated & Self-Healing Harvester Online ===');
  console.log(`Execution Timestamp: ${new Date().toISOString()}`);

  // 1. Preload existing database fingerprints and inspect cover health
  console.log('\n🔍 Preloading catalog index and diagnosing cover integrity...');
  let hasMore = true;
  let offset = 0;
  const PAGE_SIZE = 1000;
  let totalScanned = 0;
  let badCoversFound = 0;

  while (hasMore) {
    const { data: existing, error } = await supabase
      .from('media_catalog')
      .select('id, title_primary, media_type, cover_url')
      .range(offset, offset + PAGE_SIZE - 1);

    if (error || !existing || existing.length === 0) {
      hasMore = false;
      break;
    }

    for (const row of existing) {
      totalScanned++;
      const norm = normalizeTitle(row.title_primary);
      const key = `${norm}:::${row.media_type.toLowerCase()}`;
      
      if (isBadCover(row.cover_url)) {
        badCoversFound++;
        brokenCoverFingerprints.add(key);
      } else {
        healthyFingerprints.add(key);
      }
      seenIds.add(row.id);
    }

    offset += PAGE_SIZE;
    if (existing.length < PAGE_SIZE) hasMore = false;
  }

  console.log(`📊 Catalog Diagnostics Complete:`);
  console.log(`   - Total Scanned Records: ${totalScanned}`);
  console.log(`   - Healthy Records Protected (Will Skip): ${healthyFingerprints.size}`);
  console.log(`   - Broken/Placeholder Covers Detected (Targeted for Healing): ${badCoversFound}`);

  // 2. Compute dynamic page offset based on current UTC hour
  const hour = new Date().getUTCHours();
  const pageOffset = (hour * 4) % 60;
  console.log(`📄 Dynamic Page Window Start Offset: ${pageOffset}`);

  const batchQueue = [];

  // STAGE 1: MangaDex (Official Volume Covers)
  console.log('\n📥 Stage 1: Harvesting MangaDex API...');
  for (let p = 0; p < 20; p++) {
    const curOffset = (pageOffset * 100) + (p * 100);
    process.stdout.write(`  -> MangaDex offset ${curOffset}... `);
    const batch = await fetchMangaDexBatch(100, curOffset);
    console.log(`[+${batch.length} actionable titles]`);
    batchQueue.push(...batch);
    await delay(1000);
  }

  // STAGE 2: Kitsu Anime (Simulcast Posters & Adaptations)
  console.log('\n📥 Stage 2: Harvesting Kitsu Anime API...');
  for (let p = 0; p < 50; p++) {
    const curOffset = (pageOffset * 20) + (p * 20);
    process.stdout.write(`  -> Kitsu Anime offset ${curOffset}... `);
    const batch = await fetchKitsuBatch('anime', 20, curOffset);
    console.log(`[+${batch.length} actionable anime]`);
    batchQueue.push(...batch);
    await delay(500);
  }

  // STAGE 3: AniList Novels (Web/Light Novels)
  console.log('\n📥 Stage 3: Harvesting AniList Novels & Light Novels...');
  for (let p = 1; p <= 12; p++) {
    const pageNum = pageOffset + p;
    process.stdout.write(`  -> AniList Novels Page ${pageNum}... `);
    const alNovels = await fetchAniListBatch({
      page: pageNum,
      perPage: 50,
      type: 'MANGA',
      format: 'NOVEL',
      sort: ['POPULARITY_DESC'],
    });

    let count = 0;
    for (const item of alNovels) {
      const primaryTitle = item.title?.english || item.title?.romaji || item.title?.native || '';

      if (!shouldProcessItem(primaryTitle, 'novel')) {
        continue;
      }

      const rawCover = item.coverImage?.extraLarge || item.coverImage?.large;
      const finalCover = resolveNovelCover(primaryTitle, rawCover);

      markProcessed(primaryTitle, 'novel', `al-${item.id}`, !isBadCover(finalCover));

      batchQueue.push({
        id: `al-${item.id}`,
        source_type: 'anilist',
        media_type: 'novel',
        slug: `${normalizeSlug(primaryTitle)}-${item.id}`,
        title_primary: primaryTitle,
        title_secondary: item.title?.romaji || item.title?.native || null,
        cover_url: finalCover,
        banner_url: item.bannerImage ? proxyUrl(item.bannerImage) : null,
        synopsis: item.description?.replace(/<[^>]*>/g, '')?.trim() || null,
        status: item.status?.toLowerCase() === 'completed' ? 'finished' : 'releasing',
        format: 'NOVEL',
        score: item.averageScore ? parseFloat((item.averageScore / 10).toFixed(1)) : null,
        total_units: item.chapters || 0,
        genres: item.genres || [],
        official_links: extractOfficialLinks(item.externalLinks),
        updated_at: new Date().toISOString(),
      });
      count++;
    }
    console.log(`[+${count} actionable novels]`);
    await delay(1000);
  }

  console.log(`\n📦 Total Processable Batch Queue: ${batchQueue.length}`);

  if (batchQueue.length === 0) {
    console.log('✨ All queried titles are already synchronized and healthy. Zero writes needed.');
    return;
  }

  // Deduplicate before saving
  const uniqueRecords = Array.from(new Map(batchQueue.map((r) => [r.id, r])).values());
  console.log(`✨ Deduplicated to ${uniqueRecords.length} unique records to write.`);

  // 4. Batch upsert
  const CHUNK_SIZE = 500;
  let savedCount = 0;
  for (let i = 0; i < uniqueRecords.length; i += CHUNK_SIZE) {
    const chunk = uniqueRecords.slice(i, i + CHUNK_SIZE);
    process.stdout.write(`💾 Upserting batch [${i + 1} - ${i + chunk.length}] to Supabase... `);
    const { error } = await supabase.from('media_catalog').upsert(chunk, { onConflict: 'id' });
    if (!error) {
      savedCount += chunk.length;
      console.log('✅ Done');
    } else {
      console.error('❌ Error:', error.message);
    }
  }

  console.log(`\n🎉 Ingestion Finished! Successfully wrote/healed ${savedCount} series.`);
}

runSelfHealingIngestion().catch((err) => {
  console.error('[Fatal Ingestion Failure]', err);
  process.exit(1);
});
