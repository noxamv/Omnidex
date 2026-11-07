'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center space-y-3">
      <h1 className="text-xl font-black text-white">Something went wrong</h1>
      <p className="text-sm text-zinc-400">Please try again. If it keeps happening, come back later.</p>
      <button onClick={reset} className="px-4 py-2 rounded-xl bg-indigo-600 text-xs font-black text-white">Try again</button>
    </div>
  );
}
