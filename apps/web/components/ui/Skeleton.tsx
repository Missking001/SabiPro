interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse bg-surface-border rounded ${className}`} />;
}

export function ProviderCardSkeleton() {
  return (
    <div className="animate-pulse bg-neutral-0 border border-surface-border rounded-card p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 bg-surface-border rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-surface-border rounded w-3/4 mb-1" />
          <div className="h-3 bg-surface-border rounded w-1/2" />
        </div>
      </div>
      <div className="h-3 bg-surface-border rounded w-1/3 mb-2" />
      <div className="h-3 bg-surface-border rounded w-1/4" />
    </div>
  );
}
