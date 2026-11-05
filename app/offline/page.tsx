export const metadata = { title: 'Offline' };

export default function Offline() {
  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center space-y-3">
      <h1 className="text-xl font-black text-white">You&apos;re offline</h1>
      <p className="text-sm text-zinc-400">
        Omnidex needs a connection to load new chapters and news. Reconnect and try again.
      </p>
    </div>
  );
}
.
