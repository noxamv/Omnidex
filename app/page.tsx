import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export const revalidate = 1800;

export default async function HomePage({
  searchParams,
}: {
  searchParams: { type?: string; search?: string };
}) {
  const selectedType = searchParams.type || 'all';
  const searchQuery = searchParams.search || '';

  let query = supabase
    .from('media_catalog')
    .select('*')
    .order('score', { ascending: false })
    .limit(48);

  if (selectedType !== 'all') {
    query = query.eq('media_type', selectedType);
  }

  if (searchQuery) {
    query = query.ilike('title_primary', `%${searchQuery}%`);
  }

  const { data: catalog } = await query;

  const categories = [
    { label: 'All Media', value: 'all' },
    { label: 'Anime', value: 'anime' },
    { label: 'Manhwa (Webtoons)', value: 'manhwa' },
    { label: 'Manga', value: 'manga' },
    { label: 'Light & Web Novels', value: 'novel' },
  ];

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Category Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
        {categories.map((cat) => (
          <Link
            key={cat.value}
            href={`/?type=${cat.value}${searchQuery ? `&search=${searchQuery}` : ''}`}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
              selectedType === cat.value
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-[#10141d] border border-[#1c2333] text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            {cat.label}
          </Link>
        ))}
      </div>

      {/* Directory Grid */}
      {(!catalog || catalog.length === 0) ? (
        <div className="text-center py-20 border border-dashed border-[#1c2333] rounded-2xl bg-[#10141d]/30">
          <p className="text-slate-400 font-medium">Catalog is currently syncing.</p>
          <p className="text-xs text-slate-600 mt-1">Run the sync script or wait for the GitHub Action run.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {catalog.map((item) => {
            const officialSources = (item.official_links as any[]) || [];
            const primarySource = officialSources[0];

            return (
              <div
                key={item.id}
                className="group flex flex-col bg-[#10141d] rounded-xl border border-[#1c2333] overflow-hidden hover:border-indigo-500/40 transition duration-300"
              >
                <div className="aspect-[3/4] relative overflow-hidden bg-slate-900">
                  <img
                    src={item.cover_url || '/placeholder.png'}
                    alt={item.title_primary}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                  {item.score && (
                    <span className="absolute top-2 right-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-xs font-bold text-amber-400">
                      ★ {item.score}
                    </span>
                  )}
                  <span className="absolute bottom-2 left-2 bg-[#080a0f]/80 border border-[#1c2333] backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] uppercase font-bold text-indigo-400">
                    {item.media_type}
                  </span>
                </div>

                <div className="p-3 flex flex-col flex-1 justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-xs leading-snug line-clamp-2 text-slate-200 group-hover:text-indigo-400 transition">
                      {item.title_primary}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1 capitalize">{item.format || item.status}</p>
                  </div>

                  <div>
                    {primarySource ? (
                      <a
                        href={`/api/track?mediaId=${item.id}&target=${encodeURIComponent(primarySource.url)}&step=1`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-center text-xs py-1.5 bg-indigo-600/15 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg font-semibold border border-indigo-500/20 hover:border-transparent transition"
                      >
                        Official on {primarySource.site} ↗
                      </a>
                    ) : (
                      <span className="block text-center text-[11px] py-1.5 text-slate-600 bg-[#080a0f] rounded-lg">
                        Directory Indexed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
