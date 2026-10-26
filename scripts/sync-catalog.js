// scripts/sync-catalog.js

function filterOfficialLinks(item) {
  const links = item.externalLinks || [];
  
  // Comprehensive Global Platforms: English, Korean (Raw), Japanese (Raw), Chinese (Raw), Anime Streaming
  const globalTargets = [
    // 1. South Korea (Raws & Official Webtoons)
    { domain: 'comic.naver.com', site: 'Naver Webtoon (Raw)' },
    { domain: 'page.kakao.com', site: 'KakaoPage (Raw)' },
    { domain: 'series.naver.com', site: 'Naver Series (Novel/Comic)' },
    { domain: 'ridibooks.com', site: 'RidiBooks' },
    { domain: 'lezhin.com', site: 'Lezhin Korea' },

    // 2. Japan (Manga & Novel Raws / Licensed)
    { domain: 'shonenjumpplus.com', site: 'Shonen Jump+' },
    { domain: 'piccoma.com', site: 'Piccoma Japan' },
    { domain: 'cmoa.jp', site: 'Comic Cmoa' },
    { domain: 'syosetu.com', site: 'Shousetsuka ni Narou (Web Novel Raw)' },
    { domain: 'kakuyomu.jp', site: 'Kakuyomu (Kadokawa Novel)' },
    { domain: 'bookwalker.jp', site: 'BookWalker Japan' },

    // 3. China (Manhua & Web Novels)
    { domain: 'bilibilicomics.com', site: 'Bilibili Comics' },
    { domain: 'bilibili.com', site: 'Bilibili TV' },
    { domain: 'kuaikanmanhua.com', site: 'Kuaikan Manhua' },
    { domain: 'qidian.com', site: 'Qidian (Chinese Novel Raw)' },

    // 4. Global English (Webtoon, Tapas, MangaPlus, Novels)
    { domain: 'webtoons.com', site: 'WEBTOON (Global)' },
    { domain: 'tapas.io', site: 'Tapas' },
    { domain: 'tappytoon.com', site: 'Tappytoon' },
    { domain: 'mangaplus.shueisha.co.jp', site: 'MANGA Plus (Shueisha)' },
    { domain: 'viz.com', site: 'VIZ Media' },
    { domain: 'kodansha.us', site: 'Kodansha USA' },
    { domain: 'royalroad.com', site: 'Royal Road' },
    { domain: 'webnovel.com', site: 'Webnovel (Global)' },
    { domain: 'j-novel.club', site: 'J-Novel Club' },
    { domain: 'yenpress.com', site: 'Yen Press' },
    { domain: 'global.bookwalker.jp', site: 'BookWalker Global' },

    // 5. Official Anime Streaming
    { domain: 'crunchyroll.com', site: 'Crunchyroll' },
    { domain: 'netflix.com', site: 'Netflix' },
    { domain: 'hidive.com', site: 'HIDIVE' },
    { domain: 'youtube.com', site: 'YouTube (Official Animation Channels)' },
  ];

  const matched = [];
  for (const l of links) {
    if (!l.url) continue;
    const lowerUrl = l.url.toLowerCase();
    const found = globalTargets.find((t) => lowerUrl.includes(t.domain));
    if (found) {
      matched.push({
        site: found.site,
        url: l.url,
      });
    } else if (l.site) {
      matched.push({
        site: l.site,
        url: l.url,
      });
    }
  }

  // Deduplicate
  return Array.from(new Map(matched.map((m) => [m.url, m])).values());
}
