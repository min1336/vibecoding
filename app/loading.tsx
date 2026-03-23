export default function HomeLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="h-8 w-48 bg-zinc-800 rounded mb-2 animate-pulse" />
      <div className="h-4 w-64 bg-zinc-800 rounded mb-8 animate-pulse" />
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="break-inside-avoid mb-4 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden animate-pulse"
          >
            <div className="aspect-video bg-zinc-800" />
            <div className="p-4">
              <div className="h-5 w-32 bg-zinc-800 rounded mb-2" />
              <div className="h-3 w-24 bg-zinc-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
