"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Globe,
  FolderOpen,
  GitPullRequest,
  Settings,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: "translations" | "projects" | "pullRequests" | "settings";
}

interface SidebarProps {
  locale: string;
}

export function Sidebar({ locale }: SidebarProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems: NavItem[] = [
    { href: `/${locale}/app/translations`, icon: Globe, labelKey: "translations" },
    { href: `/${locale}/app/projects`, icon: FolderOpen, labelKey: "projects" },
    { href: `/${locale}/app/pull-requests`, icon: GitPullRequest, labelKey: "pullRequests" },
    { href: `/${locale}/app/settings`, icon: Settings, labelKey: "settings" },
  ];

  return (
    <aside
      className={cn(
        "flex flex-col h-screen sticky top-0 bg-[var(--color-sidebar)] transition-all duration-200",
        collapsed ? "w-14" : "w-52"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-3 mb-2">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-[var(--color-accent)] shrink-0">
          <Globe className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-sm text-[var(--color-foreground)]">
            {brand.name}
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-0.5">
        {navItems.map(({ href, icon: Icon, labelKey }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded px-2.5 py-2 text-sm transition-all duration-150",
                isActive
                  ? "border-l-2 border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] pl-[calc(0.625rem-2px)] text-[var(--color-primary)]"
                  : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-foreground)]"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{t(labelKey)}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="mt-auto px-2 pb-3 space-y-1">
        <button className="flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-sm text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-foreground)] transition-all duration-150">
          <User className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Profile</span>}
        </button>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-xs text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-container-high)] transition-all duration-150"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
