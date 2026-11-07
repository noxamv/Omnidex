export const metadata = { title: 'Privacy' };

export default function Privacy() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12 space-y-4 text-sm text-zinc-300">
      <h1 className="text-xl font-black text-white">Privacy Policy</h1>
      <p><b>What we store:</b> your email address (for sign-in), your library and reading progress, your comments, and any reports you send. We do not store passwords.</p>
      <p><b>What we do not do:</b> we do not sell your data, and we do not run advertising trackers.</p>
      <p><b>Services we use:</b> Supabase (database and sign-in), Vercel (hosting) and Cloudflare Turnstile (bot protection on sign-in). Series information comes from public sources such as AniList, MangaDex and Kitsu.</p>
      <p><b>Your choices:</b> you can export your library on the Import/Export page and permanently delete your account at <a className="text-indigo-400" href="/delete-account">/delete-account</a>.</p>
      <p><b>Contact:</b> YOUR-EMAIL@example.com</p>
    </div>
  );
}
