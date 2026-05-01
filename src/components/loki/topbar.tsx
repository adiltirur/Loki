"use client";

import { useTranslations } from "next-intl";
import { Search, ChevronRight, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTopbar } from "@/components/loki/topbar-context";
import { cn } from "@/lib/utils";

interface TopbarProps {
  className?: string;
}

export function Topbar({ className }: TopbarProps) {
  const t = useTranslations();
  const {
    breadcrumbs,
    searchEnabled,
    searchValue,
    setSearchValue,
    searchPlaceholder,
    readOnly,
  } = useTopbar();

  return (
    <header
      className={cn(
        "flex h-10 items-center gap-3 px-4 bg-[var(--color-background)] border-b border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)]",
        className
      )}
    >
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-xs text-[var(--color-muted-foreground)] label-caps flex-1 min-w-0 overflow-hidden">
          {breadcrumbs.map((crumb, i) => (
            <span key={`${i}-${crumb}`} className="flex items-center gap-1 shrink-0">
              {i > 0 && <ChevronRight className="h-3 w-3" />}
              <span className={i === breadcrumbs.length - 1 ? "text-[var(--color-foreground)]" : ""}>
                {crumb}
              </span>
            </span>
          ))}
        </nav>
      )}

      <div className="flex items-center gap-2 ml-auto">
        {searchEnabled ? (
          <div className="flex items-center gap-2 rounded px-2 py-1 bg-[var(--color-surface-container)] text-xs text-[var(--color-muted-foreground)] focus-within:ring-2 focus-within:ring-[var(--color-accent)]">
            <Search className="h-3 w-3" />
            <input
              type="search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={searchPlaceholder}
              className="bg-transparent outline-none text-xs text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] w-40"
            />
            {searchValue ? (
              <button
                type="button"
                aria-label={t("common.clearSearch")}
                onClick={() => setSearchValue("")}
                className="rounded text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              >
                <X className="h-3 w-3" />
              </button>
            ) : (
              <kbd className="rounded bg-[var(--color-surface-container-highest)] px-1 text-[10px]">⌘K</kbd>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded px-2 py-1 bg-[var(--color-surface-container)] text-xs text-[var(--color-muted-foreground)] opacity-50 select-none">
            <Search className="h-3 w-3" />
            <span>{t("common.search")}</span>
          </div>
        )}

        {readOnly && <Badge variant="permission">{t("app.permissions.readOnly")}</Badge>}
      </div>
    </header>
  );
}
