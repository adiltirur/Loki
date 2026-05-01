import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("skeleton", className)} aria-hidden="true" />;
}

export function RepoCardSkeleton() {
  return (
    <div className="rounded bg-[var(--color-card)] p-4 space-y-3 border border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)]">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-3 w-48" />
      <div className="flex items-center gap-2 pt-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function KeyListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <ul className="space-y-1.5">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-center gap-2 px-2 py-1.5">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-3 flex-1" />
        </li>
      ))}
    </ul>
  );
}

export function MemberRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-2">
      <Skeleton className="h-7 w-7 rounded-full" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-2 w-48" />
      </div>
      <Skeleton className="h-7 w-16 rounded" />
    </div>
  );
}
