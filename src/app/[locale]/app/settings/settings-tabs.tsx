"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import * as Tabs from "@radix-ui/react-tabs";
import { GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/loki/avatar";
import { GithubIntegrationCard } from "@/components/loki/github-integration-card";
import { ThemeToggleTri } from "@/components/loki/theme-toggle-tri";
import { SignOutButton } from "@/components/loki/sign-out-button";
import { useTopbarConfig } from "@/components/loki/topbar-context";
import { LOKI_SUPPORTED_LOCALES } from "@/lib/constants";
import type { UserRole } from "@/lib/roles";

interface SettingsRepo {
  owner: string;
  name: string;
  defaultBranch: string | null;
  lastScannedBranch: string | null;
  lastScannedAt: string | null;
}

interface SettingsTabsProps {
  locale: string;
  session: {
    name: string | null;
    email: string | null;
    image: string | null;
    role: UserRole;
    githubLogin: string | null;
  };
  activeOrgId: string | null;
  canManageOrg: boolean;
  repos: SettingsRepo[];
}

export function SettingsTabs({
  locale,
  session,
  activeOrgId,
  canManageOrg,
  repos,
}: SettingsTabsProps) {
  const t = useTranslations("app.settings");
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("integrations");

  useTopbarConfig({ breadcrumbs: [t("title")] });

  const tabs = [
    { id: "integrations", label: t("integrations") },
    { id: "repos", label: t("repos") },
    { id: "appearance", label: t("appearance") },
    { id: "language", label: t("language") },
    { id: "account", label: t("account") },
  ];

  function switchLocale(target: string) {
    if (target === locale) return;
    const rest = pathname.replace(/^\/[a-zA-Z-]+/, "") || "/";
    router.push(`/${target}${rest}`);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-semibold mb-6">{t("title")}</h1>

      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="flex gap-1 mb-6 border-b border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)]">
          {tabs.map((tab) => (
            <Tabs.Trigger
              key={tab.id}
              value={tab.id}
              className={cn(
                "px-3 py-2 text-sm transition-colors -mb-px focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2",
                activeTab === tab.id
                  ? "border-b-2 border-[var(--color-accent)] text-[var(--color-foreground)]"
                  : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              )}
            >
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="integrations">
          <GithubIntegrationCard orgId={activeOrgId} canManage={canManageOrg} />
        </Tabs.Content>

        <Tabs.Content value="repos">
          {repos.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">{t("reposEmpty")}</p>
          ) : (
            <ul className="space-y-2">
              {repos.map((r) => (
                <li
                  key={`${r.owner}/${r.name}`}
                  className="flex items-center gap-3 rounded bg-[var(--color-card)] px-3 py-2.5"
                >
                  <GitBranch className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono truncate">
                      {r.owner}/{r.name}
                    </p>
                    <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                      {r.lastScannedAt && r.lastScannedBranch
                        ? t("lastScanned", {
                            at: new Date(r.lastScannedAt).toLocaleString(),
                            branch: r.lastScannedBranch,
                          })
                        : t("defaultBranchLabel", { branch: r.defaultBranch ?? "—" })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Tabs.Content>

        <Tabs.Content value="appearance">
          <div className="rounded bg-[var(--color-card)] p-4 space-y-3">
            <div>
              <p className="text-sm font-medium">{t("themeTitle")}</p>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                {t("themeDescription")}
              </p>
            </div>
            <ThemeToggleTri />
          </div>
        </Tabs.Content>

        <Tabs.Content value="language">
          <div className="flex gap-2">
            {LOKI_SUPPORTED_LOCALES.map((lang) => (
              <button
                key={lang}
                onClick={() => switchLocale(lang)}
                className={cn(
                  "rounded px-3 py-1.5 text-sm border transition-colors",
                  lang === locale
                    ? "border-[var(--color-accent)] text-[var(--color-foreground)] bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)]"
                    : "border-[color-mix(in_srgb,var(--color-outline-variant)_20%,transparent)] hover:bg-[var(--color-surface-container-high)]"
                )}
              >
                {lang === "en" ? t("languageEnglish") : t("languageGerman")}
              </button>
            ))}
          </div>
        </Tabs.Content>

        <Tabs.Content value="account">
          <div className="space-y-3">
            <div className="rounded bg-[var(--color-card)] p-4 flex items-center gap-3">
              <Avatar src={session.image} name={session.name} email={session.email} size={40} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{session.name ?? t("account")}</p>
                <p className="text-xs text-[var(--color-muted-foreground)] truncate">
                  {session.email}
                </p>
                {session.githubLogin && (
                  <p className="text-[11px] text-[var(--color-muted-foreground)] mt-1 font-mono">
                    {t("githubProviderLabel", { login: session.githubLogin })}
                  </p>
                )}
                {session.role === "super_admin" && (
                  <p className="text-[11px] text-[var(--color-primary)] mt-1">{t("superAdminBadge")}</p>
                )}
              </div>
            </div>
            <SignOutButton variant="destructive">{t("signOut")}</SignOutButton>
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
