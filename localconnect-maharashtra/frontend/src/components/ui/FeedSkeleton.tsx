export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="card p-4 space-y-3 animate-pulse">
        <div className="flex gap-3">
          <div className="h-10 w-10 rounded-full bg-[hsl(var(--muted))]" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-32 bg-[hsl(var(--muted))] rounded" />
            <div className="h-3 w-48 bg-[hsl(var(--muted))] rounded" />
          </div>
        </div>
        <div className="h-4 w-full bg-[hsl(var(--muted))] rounded" />
        <div className="h-4 w-3/4 bg-[hsl(var(--muted))] rounded" />
      </div>
    ))}
  </>
  );
}
