export default function PageSkeleton({ cards = 3, rows = 5 }) {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Loading content" role="status">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: cards }).map((_, index) => <div key={index} className="h-28 rounded-2xl border border-zinc-800/60 bg-zinc-900/50" />)}
      </div>
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 space-y-4">
        <div className="h-5 w-40 rounded bg-zinc-800" />
        {Array.from({ length: rows }).map((_, index) => <div key={index} className="h-12 rounded-xl bg-zinc-800/60" />)}
      </div>
      <span className="sr-only">Loading your financial records</span>
    </div>
  );
}
