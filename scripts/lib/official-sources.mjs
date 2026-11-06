// scripts/lib/official-sources.js

/**
 * Global Official Publishing & Streaming Targets
 * Categorized by Territory, Raw Status, and License Format
 */
export const OFFICIAL_PLATFORM_REGISTRY = [
  // ==========================================
  // 1. SOUTH KOREA (Raw & Licensed Hubs)
  // ==========================================
  { domain: 'comic.naver.com', site: 'Naver Webtoon (Raw)', region: 'KR', category: 'comic', raw: true },
  { domain: 'series.naver.com', site: 'Naver Series (Webtoon & Novel)', region: 'KR', category: 'novel_comic', raw: true },
  { domain: 'page.kakao.com', site: 'KakaoPage (Official Raw)', region: 'KR', category: 'novel_comic', raw: true },
  { domain: 'webtoon.kakao.com', site: 'Kakao Webtoon', region: 'KR', category: 'comic', raw: true },
  { domain: 'ridibooks.com', site: 'RidiBooks', region: 'KR', category: 'novel_comic', raw: true },
  { domain: 'lezhin.com', site: 'Lezhin Korea', region: 'KR', category: 'comic', raw: true },
  { domain: 'toomics.com', site: 'Toomics Korea', region: 'KR', category: 'comic', raw: true },
  { domain: 'toptoon.com', site: 'Toptoon Korea', region: 'KR', category: 'comic', raw: true },
  { domain: 'munpia.com', site: 'Munpia (Web Novel Raw)', region: 'KR', category: 'novel', raw: true },
  { domain: 'novelpia.com', site: 'Novelpia (Web Novel Raw)', region: 'KR', category: 'novel', raw: true },

  // ==========================================
  // 2. JAPAN (Raw Manga, Light Novels & Web Novels)
  // ==========================================
  { domain: 'shonenjumpplus.com', site: 'Shonen Jump+ (Raw)', region: 'JP', category: 'comic', raw: true },
  { domain: 'piccoma.com', site: 'Piccoma Japan', region: 'JP', category: 'comic', raw: true },
  { domain: 'line-manga.com', site: 'LINE Manga Japan', region: 'JP', category: 'comic', raw: true },
  { domain: 'cmoa.jp', site: 'Comic Cmoa', region: 'JP', category: 'comic', raw: true },
  { domain: 'bookwalker.jp', site: 'BookWalker Japan', region: 'JP', category: 'novel_comic', raw: true },
  { domain: 'syosetu.com', site: 'Shousetsuka ni Narou (Novel Raw)', region: 'JP', category: 'novel', raw: true },
  { domain: 'kakuyomu.jp', site: 'Kakuyomu (Kadokawa Novel Raw)', region: 'JP', category: 'novel', raw: true },
  { domain: 'pocket.shonenmagazine.com', site: 'Magazine Pocket (Kodansha)', region: 'JP', category: 'comic', raw: true },
  { domain: 'tonarinoyj.jp', site: 'Tonari no Young Jump', region: 'JP', category: 'comic', raw: true },
  { domain: 'ganganonline.com', site: 'Gangan Online (Square Enix)', region: 'JP', category: 'comic', raw: true },
  { domain: 'alphapolis.co.jp', site: 'AlphaPolis', region: 'JP', category: 'novel_comic', raw: true },

  // ==========================================
  // 3. CHINA (Manhua & Web Novels)
  // ==========================================
  { domain: 'bilibili.com', site: 'Bilibili Comics & Video', region: 'CN', category: 'multimedia', raw: true },
  { domain: 'kuaikanmanhua.com', site: 'Kuaikan Manhua', region: 'CN', category: 'comic', raw: true },
  { domain: 'ac.qq.com', site: 'Tencent Animation & Comics', region: 'CN', category: 'comic', raw: true },
  { domain: 'qidian.com', site: 'Qidian (Original Web Novel Raw)', region: 'CN', category: 'novel', raw: true },
  { domain: 'zongheng.com', site: 'Zongheng Novels', region: 'CN', category: 'novel', raw: true },
  { domain: '17k.com', site: '17K Fiction', region: 'CN', category: 'novel', raw: true },

  // ==========================================
  // 4. GLOBAL ENGLISH & LICENSED TRANSLATIONS
  // ==========================================
  { domain: 'webtoons.com', site: 'WEBTOON (Global English/Multi)', region: 'US', category: 'comic', raw: false },
  { domain: 'tapas.io', site: 'Tapas Media', region: 'US', category: 'novel_comic', raw: false },
  { domain: 'tappytoon.com', site: 'Tappytoon Global', region: 'US', category: 'novel_comic', raw: false },
  { domain: 'mangaplus.shueisha.co.jp', site: 'MANGA Plus (Shueisha)', region: 'US', category: 'comic', raw: false },
  { domain: 'viz.com', site: 'VIZ Media (Shonen Jump)', region: 'US', category: 'comic', raw: false },
  { domain: 'kodansha.us', site: 'Kodansha USA', region: 'US', category: 'comic', raw: false },
  { domain: 'kmanga.kodansha.net', site: 'K Manga (Kodansha Official)', region: 'US', category: 'comic', raw: false },
  { domain: 'comikey.com', site: 'Comikey Media', region: 'US', category: 'comic', raw: false },
  { domain: 'inkr.com', site: 'INKR Comics', region: 'US', category: 'comic', raw: false },
  { domain: 'pocketcomics.com', site: 'Pocket Comics', region: 'US', category: 'comic', raw: false },
  { domain: 'global.bookwalker.jp', site: 'BookWalker Global Store', region: 'US', category: 'novel_comic', raw: false },
  { domain: 'royalroad.com', site: 'Royal Road Web Novels', region: 'US', category: 'novel', raw: false },
  { domain: 'webnovel.com', site: 'Webnovel (Qidian Global)', region: 'US', category: 'novel_comic', raw: false },
  { domain: 'j-novel.club', site: 'J-Novel Club', region: 'US', category: 'novel', raw: false },
  { domain: 'yenpress.com', site: 'Yen Press / Ize Press', region: 'US', category: 'novel_comic', raw: false },
  { domain: 'sevenseasentertainment.com', site: 'Seven Seas Entertainment', region: 'US', category: 'novel_comic', raw: false },

  // ==========================================
  // 5. OFFICIAL ANIME STREAMING PLATFORMS
  // ==========================================
  { domain: 'crunchyroll.com', site: 'Crunchyroll', region: 'GLOBAL', category: 'anime', raw: false },
  { domain: 'netflix.com', site: 'Netflix', region: 'GLOBAL', category: 'anime', raw: false },
  { domain: 'hidive.com', site: 'HIDIVE', region: 'GLOBAL', category: 'anime', raw: false },
  { domain: 'disneyplus.com', site: 'Disney+ (Anime Channel)', region: 'GLOBAL', category: 'anime', raw: false },
  { domain: 'hulu.com', site: 'Hulu', region: 'US', category: 'anime', raw: false },
  { domain: 'primevideo.com', site: 'Amazon Prime Video', region: 'GLOBAL', category: 'anime', raw: false },
  { domain: 'youtube.com', site: 'YouTube (Muse Asia / Ani-One)', region: 'GLOBAL', category: 'anime', raw: false },
];

/**
 * Evaluates raw externalLinks array against registered platforms
 */
export function extractOfficialLinks(externalLinks = []) {
  if (!Array.isArray(externalLinks) || externalLinks.length === 0) return [];

  const matched = [];

  for (const item of externalLinks) {
    if (!item?.url) continue;
    const lowerUrl = item.url.toLowerCase();

    const regMatch = OFFICIAL_PLATFORM_REGISTRY.find((entry) => lowerUrl.includes(entry.domain));
    if (regMatch) {
      matched.push({
        site: regMatch.site,
        url: item.url,
        region: regMatch.region,
        category: regMatch.category,
        is_raw: regMatch.raw,
      });
    } else if (item.site) {
      matched.push({
        site: item.site,
        url: item.url,
        region: 'GLOBAL',
        category: 'general',
        is_raw: false,
      });
    }
  }

  // Deduplicate on distinct target URLs
  return Array.from(new Map(matched.map((m) => [m.url, m])).values());
}
