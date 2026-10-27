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

// Endpoints
const ANILIST_ENDPOINT = 'https://graphql.anilist.co';
const MANGADEX_ENDPOINT = 'https://api.mangadex.org';
const KITSU_ENDPOINT = 'https://kitsu.io/api/edge';

// Canonical Illustrated Covers for Web/Light Novels
const CANONICAL_NOVEL_COVERS = {
  'lord of the mysteries': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx118485-6nSgLrq0yGvU.jpg',
  'shadow slave': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx164746-bL5x1eFfqVqG.jpg',
  'mother of learning': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx143093-Xh1sE0MvM3d1.jpg',
  'the primal hunter': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx164747-dE4a7aXJ3GqM.jpg',
  'defiance of the fall': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx164748-kL9e5a1b3c4d.jpg',
  'reverend insanity': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx110682-1jRjWv3i6C1X.jpg',
  'coiling dragon': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85403-sO7760rE33o4.jpg',
  'the beginning after the end': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx108343-s5e89wO0mK1m.jpg',
  'trash of the counts family': 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx112217-v4B44k1a7V1C.jpg',
};

// ==============================================================================
// 1. MANGADEX API INGESTION (Official Manga, Manhwa, Manhua Volume Covers)
// ==============================================================================
async function fetchMangaDexBatch(limit = 100, offset = 0) {
  try {
    const url = `${MANGADEX_ENDPOINT}/manga?limit=${limit}&offset=${offset}&includes[]=cover_art&order[followedCount]=desc&contentRating[]=safe&contentRating[]=suggestive`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Omnidex-Catalog-Sync/3.0' },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const data = json.data || [];

    return data.map((item) => {
      const title = item.attributes?.title?.en || Object.values(item.attributes?.title || {})[0] || 'Untitled';
      const coverRel = item.relationships?.find((r) => r.type === 'cover_art');
      const fileName = coverRel?.attributes?.fileName;
      const coverUrl = fileName ? `https://uploads.mangadex.org/covers/${item.id}/${fileName}.512.jpg` : null;
      const origLang = item.attributes?.originalLanguage;

      let mediaType = 'manga';
      if (origLang === 'ko') mediaType = 'manhwa';
      else if (origLang === 'zh' || origLang === 'zh-hk') mediaType = 'manhua';

      const cleanSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      return {
        id: `md-${item.id}`,
        source_type: 'mangadex',
        media_type: mediaType,
        slug: `${cleanSlug || 'series'}-${item.id.slice(0, 8)}`,
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
      };
    });
  } catch (err) {
    console.warn('[MangaDex Fetch Warning]', err.message);
    return [];
  }
}

// ==============================================================================
// 2. KITSU API INGESTION (Anime & Manga High-Res Posters)
// ==============================================================================
async function fetchKitsuBatch(type = 'anime', limit = 20, offset = 0) {
  try {
    const url = `${KITSU_ENDPOINT}/${type}?page[limit]=${limit}&page[offset]=${offset}&sort=-userCount`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/vnd.api+json' },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const data = json.data || [];

    return data.map((item) => {
      const attr = item.attributes || {};
      const title = attr.canonicalTitle || attr.titles?.en || attr.titles?.en_jp || 'Untitled';
      const cleanSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      return {
        id: `kt-${item.id}`,
        source_type: 'kitsu',
        media_type: type === 'anime' ? 'anime' : (attr.subtype === 'manhwa' ? 'manhwa' : 'manga'),
        slug: `${cleanSlug || 'series'}-${item.id}`,
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
      };
    });
  } catch (err) {
    console.warn('[Kitsu Fetch Warning]', err.message);
    return [];
  }
}

// ==============================================================================
// 3. ANILIST GRAPHQL INGESTION (Taxonomy & Novels)
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

function resolveNovelCover(title, fallback) {
  const lower = (title || '').toLowerCase();
  for (const [key, url] of Object.entries(CANONICAL_NOVEL_COVERS)) {
    if (lower.includes(key)) return url;
  }
  return fallback;
}

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
// MAIN MULTI-PLATFORM HARVESTER
// ==============================================================================
async function runMultiPlatformIngestion() {
  console.log('=== Omnidex Multi-Platform Catalog Engine Online ===');
  console.log(`Sources: MangaDex API + Kitsu API + AniList GraphQL`);
  console.log(`Execution Time: ${new Date().toISOString()}`);

  const allRecords = [];

  // STAGE 1: MangaDex Official Covers
  console.log('\n📥 Stage 1: Ingesting verified titles from MangaDex API...');
  for (let offset = 0; offset <= 400; offset += 100) {
    process.stdout.write(`  -> Fetching MangaDex offset ${offset}... `);
    const mdItems = await fetchMangaDexBatch(100, offset);
    console.log(`[+${mdItems.length} titles]`);
    allRecords.push(...mdItems);
    await delay(1200);
  }

  // STAGE 2: Kitsu Anime & Manga
  console.log('\n📥 Stage 2: Ingesting high-res posters from Kitsu API...');
  for (let offset = 0; offset <= 200; offset += 20) {
    process.stdout.write(`  -> Fetching Kitsu Anime offset ${offset}... `);
    const ktAnime = await fetchKitsuBatch('anime', 20, offset);
    console.log(`[+${ktAnime.length} titles]`);
    allRecords.push(...ktAnime);
    await delay(600);
  }

  // STAGE 3: AniList (Web Novels & Core Catalog)
  console.log('\n📥 Stage 3: Ingesting Light & Web Novels from AniList...');
  for (let p = 1; p <= 15; p++) {
    process.stdout.write(`  -> Fetching AniList Novels Page ${p}/15... `);
    const alNovels = await fetchAniListBatch({
      page: p, perPage: 50, type: 'MANGA', format: 'NOVEL', sort: ['POPULARITY_DESC'],
    });
    console.log(`[+${alNovels.length} titles]`);
    const mapped = alNovels.map((item) => {
      const primaryTitle = item.title?.english || item.title?.romaji || item.title?.native || 'Untitled Novel';
      const cleanSlug = primaryTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const cover = resolveNovelCover(primaryTitle, item.coverImage?.extraLarge || item.coverImage?.large);

      return {
        id: `al-${item.id}`,
        source_type: 'anilist',
        media_type: 'novel',
        slug: `${cleanSlug || 'novel'}-${item.id}`,
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
      };
    });
    allRecords.push(...mapped);
    await delay(1000);
  }

  console.log(`\n📦 Total Raw Media Harvested: ${allRecords.length}`);

  // Deduplicate by ID
  const uniqueCatalog = Array.from(new Map(allRecords.map((r) => [r.id, r])).values());
  console.log(`✨ Deduplicated to ${uniqueCatalog.length} unique catalog records.`);

  // Upsert in batches of 500
  const CHUNK_SIZE = 500;
  let savedCount = 0;
  for (let i = 0; i < uniqueCatalog.length; i += CHUNK_SIZE) {
    const chunk = uniqueCatalog.slice(i, i + CHUNK_SIZE);
    process.stdout.write(`💾 Upserting chunk [${i + 1} - ${i + chunk.length}] to Supabase... `);
    const { error } = await supabase.from('media_catalog').upsert(chunk, { onConflict: 'id' });
    if (!error) {
      savedCount += chunk.length;
      console.log('✅ Done');
    } else {
      console.error('❌ Error:', error.message);
    }
  }

  console.log(`\n🎉 Multi-Platform Ingestion Complete! Total Synchronized: ${savedCount}`);
}

runMultiPlatformIngestion().catch((err) => {
  console.error('[Fatal Ingestion Failure]', err);
  process.exit(1);
});
