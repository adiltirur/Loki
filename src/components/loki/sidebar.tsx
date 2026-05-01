"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Globe,
  FolderOpen,
  GitPullRequest,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
} from "lucide-react";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/loki/avatar";
import { OrgSwitcher, type OrgEntry } from "@/components/loki/org-switcher";
import { ThemeToggle } from "@/components/loki/theme-toggle";
import type { UserRole } from "@/lib/roles";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: "translations" | "projects" | "pullRequests" | "settings";
}

interface SidebarSession {
  name: string | null;
  email: string | null;
  image: string | null;
  role: UserRole;
  githubLogin: string | null;
}

interface SidebarProps {
  locale: string;
  session: SidebarSession;
  orgs: OrgEntry[];
  activeOrgId: string | null;
}

export function Sidebar({ locale, session, orgs, activeOrgId }: SidebarProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems: NavItem[] = [
    { href: `/${locale}/app/translations`, icon: Globe, labelKey: "translations" },
    { href: `/${locale}/app/projects`, icon: FolderOpen, labelKey: "projects" },
    { href: `/${locale}/app/pull-requests`, icon: GitPullRequest, labelKey: "pullRequests" },
    { href: `/${locale}/app/settings`, icon: Settings, labelKey: "settings" },
  ];

  const adminHref = `/${locale}/app/admin`;
  const isSuperAdmin = session.role === "super_admin";

  return (
    <aside
      className={cn(
        "flex flex-col h-screen sticky top-0 bg-[var(--color-sidebar)] transition-all duration-200 border-r border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)]",
        collapsed ? "w-14" : "w-52"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-3">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-[var(--color-accent)] shrink-0">
          <Globe className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-sm text-[var(--color-foreground)]">
            {brand.name}
          </span>
        )}
      </div>

      <OrgSwitcher orgs={orgs} activeOrgId={activeOrgId} collapsed={collapsed} />

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-0.5">
        {navItems.map(({ href, icon: Icon, labelKey }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded px-2.5 py-2 text-sm transition-all duration-150 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2",
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

        {isSuperAdmin && (
          <Link
            href={adminHref}
            className={cn(
              "flex items-center gap-2.5 rounded px-2.5 py-2 text-sm transition-all duration-150 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2",
              pathname.startsWith(adminHref)
                ? "border-l-2 border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] pl-[calc(0.625rem-2px)] text-[var(--color-primary)]"
                : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-foreground)]"
            )}
          >
            <Shield className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Admin</span>}
          </Link>
        )}
      </nav>

      {/* Bottom: profile dropdown + collapse toggle */}
      <div className="mt-auto px-2 pb-3 space-y-1">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className={cn(
                "flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-sm transition-all duration-150",
                "text-[var(--color-foreground)] hover:bg-[var(--color-surface-container-high)]",
                "focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2"
              )}
              aria-label="Profile menu"
            >
              <Avatar src={session.image} name={session.name} email={session.email} size={24} />
              {!collapsed && (
                <span className="truncate text-left text-xs flex-1 min-w-0">
                  {session.name ?? session.email ?? "Account"}
                </span>
              )}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              side="top"
              align="start"
              sideOffset={4}
              className="min-w-56 rounded border border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)] bg-[var(--color-surface-container-highest)] p-1 shadow-ambient z-50"
            >
              <div className="px-2 py-2">
                <p className="text-xs font-medium truncate">{session.name ?? "Account"}</p>
                <p className="text-[11px] text-[var(--color-muted-foreground)] truncate">
                  {session.email ?? ""}
                </p>
              </div>
              <DropdownMenu.Separator className="my-1 h-px bg-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)]" />
              <DropdownMenu.Item asChild>
                <Link
                  href={`/${locale}/app/settings`}
                  className="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-[var(--color-foreground)] hover:bg-[var(--color-surface-container-high)] cursor-pointer outline-none"
                >
                  <Settings className="h-3 w-3" />
                  Settings
                </Link>
              </DropdownMenu.Item>
              {isSuperAdmin && (
                <DropdownMenu.Item asChild>
                  <Link
                    href={adminHref}
                    className="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-[var(--color-foreground)] hover:bg-[var(--color-surface-container-high)] cursor-pointer outline-none"
                  >
                    <Shield className="h-3 w-3" />
                    Admin panel
                  </Link>
                </DropdownMenu.Item>
              )}
              <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs text-[var(--color-muted-foreground)]">
                <span>Theme</span>
                <ThemeToggle />
              </div>
              <DropdownMenu.Separator className="my-1 h-px bg-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)]" />
              <DropdownMenu.Item
                className="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-[var(--color-destructive)] hover:bg-[var(--color-surface-container-high)] cursor-pointer outline-none"
                onSelect={(e) => {
                  e.preventDefault();
                  signOut({ callbackUrl: "/" });
                }}
              >
                <LogOut className="h-3 w-3" />
                Sign out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-xs text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-container-high)] transition-all duration-150 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2"
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
