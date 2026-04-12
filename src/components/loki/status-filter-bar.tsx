"use client";

import { cn } from "@/lib/utils";
import type { LockStatus } from "@/lib/loki-lock";

interface StatusFilterBarProps {
  counts: Record<LockStatus, number>;
  active: LockStatus | "all";
  onChange: (filter: LockStatus | "all") => void;
}

const FILTERS: { label: string; value: LockStatus | "all"; dot?: string }[] = [
  { label: "All", value: "all" },
  { label: "Unreviewed", value: "unreviewed", dot: "bg-[var(--color-muted-foreground)]" },
  { label: "Pending", value: "pending_review", dot: "bg-[var(--color-warning)]" },
  { label: "Approved", value: "approved", dot: "bg-[var(--color-success)]" },
  { label: "Rejected", value: "rejected", dot: "bg-[var(--color-destructive)]" },
];

export function StatusFilterBar({ counts, active, onChange }: StatusFilterBarProps) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)] overflow-x-auto no-scrollbar">
      {FILTERS.map(({ label, value, dot }) => {
        const count = value === "all" ? total : counts[value];
        const isActive = active === value;
        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={cn(
              "flex items-center gap-1 shrink-0 rounded px-1.5 py-0.5 text-[10px] transition-colors",
              isActive
                ? "bg-[var(--color-surface-container-high)] text-[var(--color-foreground)]"
                : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            )}
          >
            {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />}
            <span>{label}</span>
            <span className="opacity-60">({count})</span>
          </button>
        );
      })}
    </div>
  );
}
