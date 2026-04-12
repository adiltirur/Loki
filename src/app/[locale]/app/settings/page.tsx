"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import * as Tabs from "@radix-ui/react-tabs";
import { GitBranch, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const t = useTranslations("app.settings");
  const [activeTab, setActiveTab] = useState("integrations");

  const tabs = [
    { id: "integrations", label: t("integrations") },
    { id: "repos", label: t("repos") },
    { id: "appearance", label: t("appearance") },
    { id: "language", label: t("language") },
    { id: "account", label: t("account") },
  ];

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
                "px-3 py-2 text-sm transition-colors -mb-px",
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
          <div className="rounded bg-[var(--color-card)] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GitBranch className="h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">GitHub</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Check className="h-3 w-3 text-[var(--color-success)]" />
                    <span className="text-xs text-[var(--color-success)]">{t("githubConnected")}</span>
                  </div>
                </div>
              </div>
              <Button size="sm" variant="secondary">{t("reconnect")}</Button>
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="repos">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Repository settings coming soon.
          </p>
        </Tabs.Content>

        <Tabs.Content value="appearance">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Appearance settings coming soon.
          </p>
        </Tabs.Content>

        <Tabs.Content value="language">
          <div className="flex gap-2">
            {["en", "de"].map((lang) => (
              <button
                key={lang}
                className="rounded px-3 py-1.5 text-sm border border-[color-mix(in_srgb,var(--color-outline-variant)_20%,transparent)] hover:bg-[var(--color-surface-container-high)] transition-colors"
              >
                {lang === "en" ? "English" : "Deutsch"}
              </button>
            ))}
          </div>
        </Tabs.Content>

        <Tabs.Content value="account">
          <div className="space-y-3">
            <div className="rounded bg-[var(--color-card)] p-4">
              <p className="text-sm font-medium">Account</p>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-1">user@example.com</p>
            </div>
            <Button size="sm" variant="destructive">{t("signOut")}</Button>
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
