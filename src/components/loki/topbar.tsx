"use client";

import { useTranslations } from "next-intl";
import { Search, ChevronRight, LogOut, Settings } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/loki/theme-toggle";
import { cn } from "@/lib/utils";

interface TopbarProps {
  breadcrumbs?: string[];
  readOnly?: boolean;
  className?: string;
}

export function Topbar({ breadcrumbs = [], readOnly = false, className }: TopbarProps) {
  const t = useTranslations();

  return (
    <header
      className={cn(
        "flex h-10 items-center gap-3 px-4 bg-[var(--color-background)]",
        className
      )}
    >
      {/* Breadcrumb */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-xs text-[var(--color-muted-foreground)] label-caps flex-1 min-w-0 overflow-hidden">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1 shrink-0">
              {i > 0 && <ChevronRight className="h-3 w-3" />}
              <span className={i === breadcrumbs.length - 1 ? "text-[var(--color-foreground)]" : ""}>
                {crumb}
              </span>
            </span>
          ))}
        </nav>
      )}

      <div className="flex items-center gap-2 ml-auto">
        {/* Search */}
        <div className="flex items-center gap-2 rounded px-2 py-1 bg-[var(--color-surface-container)] text-xs text-[var(--color-muted-foreground)]">
          <Search className="h-3 w-3" />
          <span>{t("common.search")}</span>
          <kbd className="rounded bg-[var(--color-surface-container-highest)] px-1 text-[10px]">⌘K</kbd>
        </div>

        {/* Read-only badge */}
        {readOnly && (
          <Badge variant="permission">{t("app.permissions.readOnly")}</Badge>
        )}

        {/* Theme toggle */}
        <ThemeToggle />

        {/* User menu */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-surface-container-high)] text-xs font-medium text-[var(--color-foreground)] hover:bg-[var(--color-surface-container-highest)] transition-colors">
              A
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-40 rounded border border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)] bg-[var(--color-surface-container-highest)] p-1 shadow-ambient z-50"
              sideOffset={4}
              align="end"
            >
              <DropdownMenu.Item className="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-[var(--color-foreground)] hover:bg-[var(--color-surface-container-high)] cursor-pointer outline-none">
                <Settings className="h-3 w-3" />
                {t("app.settings.title")}
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)]" />
              <DropdownMenu.Item className="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-[var(--color-destructive)] hover:bg-[var(--color-surface-container-high)] cursor-pointer outline-none">
                <LogOut className="h-3 w-3" />
                {t("app.settings.signOut")}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
