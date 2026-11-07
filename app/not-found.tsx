import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center space-y-3">
      <h1 className="text-xl font-black text-white">Page not found</h1>
      <p className="text-sm text-zinc-400">That page doesn&apos;t exist or was moved.</p>
      <Link href="/" className="inline-block px-4 py-2 rounded-xl bg-indigo-600 text-xs font-black text-white">Back home</Link>
    </div>
  );
}
