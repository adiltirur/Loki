"use client";

import { Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusFilterBar } from "@/components/loki/status-filter-bar";
import type { L10nFileGroup } from "@/lib/file-grouping";
import type { LokiLockData, LockStatus } from "@/lib/loki-lock";
import { getKeyOverallStatus } from "@/lib/loki-lock";

interface KeyListPanelProps {
  groups: L10nFileGroup[];
  activeGroup: L10nFileGroup | null;
  onSelectGroup: (group: L10nFileGroup) => void;
  filteredKeys: string[];
  primaryKeys: string[];
  selectedKey: string | null;
  selectedKeys: Set<string>;
  searchQuery: string;
  statusFilter: LockStatus | "all";
  lockData: LokiLockData;
  onSelectKey: (key: string) => void;
  onToggleKeySelection: (key: string) => void;
  onSearchChange: (q: string) => void;
  onStatusFilterChange: (filter: LockStatus | "all") => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onAddKey: () => void;
  isKeyEdited: (key: string) => boolean;
  isKeyMissing: (locale: string, key: string) => boolean;
  getStatusCounts: () => Record<LockStatus, number>;
  owner: string;
  repo: string;
}

const LOCALE_FLAG: Record<string, string> = {
  en: "🇬🇧", de: "🇩🇪", fr: "🇫🇷", es: "🇪🇸", it: "🇮🇹",
  pt: "🇵🇹", nl: "🇳🇱", pl: "🇵🇱", ru: "🇷🇺", ja: "🇯🇵",
  ko: "🇰🇷", zh: "🇨🇳", ar: "🇸🇦", tr: "🇹🇷", sv: "🇸🇪",
};

function localeLabel(locale: string) {
  return LOCALE_FLAG[locale.split("-")[0]] ?? "🌐";
}

export function KeyListPanel({
  groups,
  activeGroup,
  onSelectGroup,
  filteredKeys,
  primaryKeys,
  selectedKey,
  selectedKeys,
  searchQuery,
  statusFilter,
  lockData,
  onSelectKey,
  onToggleKeySelection,
  onSearchChange,
  onStatusFilterChange,
  onSelectAll,
  onClearSelection,
  onAddKey,
  isKeyEdited,
  isKeyMissing,
  getStatusCounts,
  owner,
  repo,
}: KeyListPanelProps) {
  const nonPrimaryLocales = activeGroup
    ? activeGroup.files.filter((f) => f.locale !== activeGroup.primaryLocale).map((f) => f.locale)
    : [];

  const getKeyDot = (key: string): { color: string; title: string } => {
    if (isKeyEdited(key)) return { color: "bg-[var(--color-warning)]", title: "Edited" };
    const anyMissing = nonPrimaryLocales.some((l) => isKeyMissing(l, key));
    if (anyMissing) return { color: "bg-[var(--color-destructive)]", title: "Missing in some locales" };
    const lockStatus = getKeyOverallStatus(lockData, key, nonPrimaryLocales);
    if (lockStatus === "rejected") return { color: "bg-[var(--color-destructive)]", title: "Rejected" };
    if (lockStatus === "pending_review") return { color: "bg-[var(--color-warning)]", title: "Pending review" };
    if (lockStatus === "approved") return { color: "bg-[var(--color-success)]", title: "Approved" };
    return { color: "bg-[var(--color-muted-foreground)] opacity-40", title: "Unreviewed" };
  };

  const allSelected = selectedKeys.size === filteredKeys.length && filteredKeys.length > 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header: repo name + group selector */}
      <div className="px-3 py-2 border-b border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)] shrink-0">
        <p className="label-caps text-[var(--color-muted-foreground)] mb-1.5">{owner}/{repo}</p>
        {groups.length > 1 && (
          <select
            value={activeGroup ? `${activeGroup.directory}|||${activeGroup.baseName}` : ""}
            onChange={(e) => {
              const [dir, base] = e.target.value.split("|||");
              const group = groups.find((g) => g.directory === dir && g.baseName === base);
              if (group) onSelectGroup(group);
            }}
            className="w-full text-xs rounded bg-[var(--color-surface-container)] text-[var(--color-foreground)] px-2 py-1 outline-none"
          >
            {groups.map((g) => {
              const key = `${g.directory}|||${g.baseName}`;
              const label = g.baseName
                ? `${g.directory}/${g.baseName}`
                : g.directory || "root";
              return (
                <option key={key} value={key}>
                  {label} ({g.files.map((f) => localeLabel(f.locale)).join(" ")})
                </option>
              );
            })}
          </select>
        )}
      </div>

      {/* Locale pills for active group */}
      {activeGroup && (
        <div className="flex items-center gap-1 px-3 py-1.5 border-b border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)] shrink-0 overflow-x-auto no-scrollbar">
          {activeGroup.files.map(({ locale }) => (
            <span
              key={locale}
              className="flex items-center gap-0.5 text-[10px] text-[var(--color-muted-foreground)] shrink-0"
            >
              {localeLabel(locale)}{" "}
              <span className="font-mono">{locale}</span>
              {locale === activeGroup.primaryLocale && (
                <span className="text-[8px] opacity-50 ml-0.5">src</span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Status filter bar */}
      {activeGroup && (
        <StatusFilterBar
          counts={getStatusCounts()}
          active={statusFilter}
          onChange={onStatusFilterChange}
        />
      )}

      {/* Search */}
      {activeGroup && (
        <div className="flex items-center gap-2 px-2 py-1.5 border-b border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)] shrink-0">
          <Search className="h-3 w-3 text-[var(--color-muted-foreground)] shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search keys..."
            className="flex-1 bg-transparent text-xs text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] outline-none"
          />
        </div>
      )}

      {/* Bulk selection bar */}
      {selectedKeys.size > 0 && (
        <div className="flex items-center justify-between px-2 py-1 bg-[var(--color-surface-container-high)] border-b border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)] shrink-0">
          <span className="text-[10px] text-[var(--color-foreground)]">
            {selectedKeys.size} selected
          </span>
          <button
            onClick={onClearSelection}
            className="text-[10px] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          >
            Clear
          </button>
        </div>
      )}

      {/* Key list */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {filteredKeys.length === 0 ? (
          <p className="p-3 text-xs text-[var(--color-muted-foreground)]">
            {primaryKeys.length === 0 ? "No keys found" : "No keys match the filter"}
          </p>
        ) : (
          <>
            {/* Select all row */}
            {filteredKeys.length > 1 && (
              <div
                className="flex items-center gap-2 px-2 py-1 border-b border-[color-mix(in_srgb,var(--color-outline-variant)_8%,transparent)]"
              >
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={allSelected ? onClearSelection : onSelectAll}
                  className="h-3 w-3 rounded accent-[var(--color-primary)]"
                />
                <span className="text-[10px] text-[var(--color-muted-foreground)]">
                  Select all ({filteredKeys.length})
                </span>
              </div>
            )}

            {filteredKeys.map((key) => {
              const dot = getKeyDot(key);
              const isSelected = selectedKeys.has(key);
              const isActive = selectedKey === key;

              return (
                <div
                  key={key}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 cursor-pointer transition-colors group",
                    isActive
                      ? "bg-[var(--color-surface-container-high)]"
                      : "hover:bg-[var(--color-surface-container)]"
                  )}
                  onClick={() => onSelectKey(key)}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleKeySelection(key)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-3 w-3 rounded accent-[var(--color-primary)] shrink-0 opacity-0 group-hover:opacity-100 data-[checked]:opacity-100"
                    data-checked={isSelected ? "" : undefined}
                  />
                  {/* Status dot */}
                  <span
                    className={cn("h-1.5 w-1.5 rounded-full shrink-0", dot.color)}
                    title={dot.title}
                  />
                  {/* Key name */}
                  <span className="font-mono text-xs text-[var(--color-foreground)] truncate flex-1">
                    {key}
                  </span>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Add key button */}
      {activeGroup && (
        <div className="shrink-0 border-t border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)] px-2 py-2">
          <button
            onClick={onAddKey}
            className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors w-full"
          >
            <Plus className="h-3 w-3" />
            Add key
          </button>
        </div>
      )}
    </div>
  );
}
