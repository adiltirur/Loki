"use client";

import { useTranslations } from "next-intl";
import { ExternalLink, Sparkles, GitPullRequest } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LOKI_PR_STATUS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface PullRequest {
  id: string;
  repo: string;
  number: number;
  title: string;
  sourceBranch: string;
  targetBranch: string;
  addedKeys: number;
  removedKeys: number;
  status: keyof typeof LOKI_PR_STATUS;
  updatedAt: string;
  author: string;
  prUrl?: string;
}

const STUB_PRS: PullRequest[] = [
  {
    id: "1",
    repo: "loki-core-engine",
    number: 1242,
    title: "feat: upgrade i18next core to v23.0",
    sourceBranch: "main",
    targetBranch: "feature/i18n-upgrade",
    addedKeys: 142,
    removedKeys: 12,
    status: "OPEN",
    updatedAt: "Oct 24, 2023",
    author: "@alex_dev",
    prUrl: "#",
  },
  {
    id: "2",
    repo: "loki-web-portal",
    number: 983,
    title: "fix: localized error messages for auth flow",
    sourceBranch: "staging",
    targetBranch: "fix/auth-locales",
    addedKeys: 24,
    removedKeys: 8,
    status: "MERGED",
    updatedAt: "Oct 23, 2023",
    author: "@sarah_eng",
    prUrl: "#",
  },
  {
    id: "3",
    repo: "loki-cli-tool",
    number: 451,
    title: "refactor: remove deprecated v1 translation keys",
    sourceBranch: "main",
    targetBranch: "cleanup/v1-removal",
    addedKeys: 0,
    removedKeys: 412,
    status: "CLOSED",
    updatedAt: "Oct 21, 2023",
    author: "@mike_arch",
    prUrl: "#",
  },
  {
    id: "4",
    repo: "loki-api-gateway",
    number: 332,
    title: "docs: update swagger i18n descriptions",
    sourceBranch: "main",
    targetBranch: "docs/api-i18n",
    addedKeys: 12,
    removedKeys: 0,
    status: "OPEN",
    updatedAt: "Oct 20, 2023",
    author: "@jenna_loc",
    prUrl: "#",
  },
];

const statusVariant: Record<keyof typeof LOKI_PR_STATUS, "success" | "primary" | "destructive"> = {
  OPEN: "success",
  MERGED: "primary",
  CLOSED: "destructive",
};

const statusLabel: Record<keyof typeof LOKI_PR_STATUS, string> = {
  OPEN: "Open",
  MERGED: "Merged",
  CLOSED: "Closed",
};

const stats = [
  { label: "Active Requests", value: "12" },
  { label: "Merged (24h)", value: "38" },
  { label: "Avg Review Time", value: "2.4h" },
  { label: "Conflict Rate", value: "4%" },
];

export function PRList({ prs = STUB_PRS }: { prs?: PullRequest[] }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded bg-[var(--color-card)] p-4"
          >
            <p className="label-caps text-[var(--color-muted-foreground)] mb-2">{stat.label}</p>
            <p className="text-2xl font-semibold text-[var(--color-primary)]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* PR table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="label-caps text-[var(--color-muted-foreground)] pb-3 pr-4 font-normal">
                Repository &amp; Pull Request
              </th>
              <th className="label-caps text-[var(--color-muted-foreground)] pb-3 pr-4 font-normal">
                Changed Keys
              </th>
              <th className="label-caps text-[var(--color-muted-foreground)] pb-3 pr-4 font-normal">
                Status
              </th>
              <th className="label-caps text-[var(--color-muted-foreground)] pb-3 pr-4 font-normal">
                Last Updated
              </th>
              <th className="label-caps text-[var(--color-muted-foreground)] pb-3 font-normal">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {prs.map((pr) => (
              <tr
                key={pr.id}
                className="border-t border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)] hover:bg-[var(--color-surface-container)] transition-colors"
              >
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-1.5 font-medium text-[var(--color-primary)] mb-0.5">
                    <GitPullRequest className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {pr.repo} #{pr.number}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-muted-foreground)] mb-0.5">{pr.title}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)] opacity-60 font-mono">
                    {pr.sourceBranch} → {pr.targetBranch}
                  </p>
                </td>
                <td className="py-3 pr-4 text-xs">
                  <span className="text-[var(--color-success)]">+{pr.addedKeys}</span>
                  {" "}
                  <span className="text-[var(--color-destructive)]">-{pr.removedKeys}</span>
                  <p className="text-[var(--color-muted-foreground)] mt-0.5">
                    {pr.addedKeys + pr.removedKeys} Total keys
                  </p>
                </td>
                <td className="py-3 pr-4">
                  <Badge variant={statusVariant[pr.status]}>
                    {statusLabel[pr.status]}
                  </Badge>
                </td>
                <td className="py-3 pr-4 text-xs text-[var(--color-muted-foreground)]">
                  {pr.updatedAt}
                  <p>{pr.author}</p>
                </td>
                <td className="py-3">
                  {pr.prUrl && (
                    <a
                      href={pr.prUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
                    >
                      GitHub
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AI Recommendation */}
      <div className="rounded p-4 border-l-4 border-[var(--color-success)] bg-[color-mix(in_srgb,var(--color-success-container)_15%,transparent)]">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-success)] mb-2">
          <Sparkles className="h-4 w-4" />
          AI Sync Recommendation
        </div>
        <p className="text-xs text-[var(--color-muted-foreground)] mb-3">
          Detected 14 identical keys modified across repositories. Merging these changes
          atomically prevents staging environment build failures.
        </p>
        <div className="flex gap-2">
          <Button size="sm">Review Sync Cluster</Button>
          <Button size="sm" variant="secondary">Dismiss</Button>
        </div>
      </div>
    </div>
  );
}
