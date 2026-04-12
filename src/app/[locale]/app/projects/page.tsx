"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Plus,
  FolderOpen,
  Lock,
  Globe,
  GitBranch,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BranchPicker } from "@/components/loki/branch-picker";
import type { GithubRepo } from "@/lib/github";

const GITHUB_APP_NAME = process.env.NEXT_PUBLIC_GITHUB_APP_NAME ?? "loki-app";

function installUrl(locale: string) {
  return `https://github.com/apps/${GITHUB_APP_NAME}/installations/new?state=${locale}`;
}

export default function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const t = useTranslations("nav");
  const router = useRouter();
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [locale, setLocale] = useState("en");
  const [pickerRepo, setPickerRepo] = useState<GithubRepo | null>(null);

  useEffect(() => {
    params.then((p) => setLocale(p.locale));
  }, [params]);

  useEffect(() => {
    fetch("/api/repos")
      .then((r) => r.json())
      .then((d) => setRepos(d.repos ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleBranchSelect = (branch: string) => {
    if (!pickerRepo) return;
    // Validate all URL parameters before navigation.
    // owner/repo: GitHub only allows alphanumerics, hyphens, dots, underscores.
    // branch: block path traversal and null bytes; all other chars are safe in
    //         a query string because URLSearchParams percent-encodes them.
    // installationId: must be a positive integer.
    if (!pickerRepo.owner || !/^[a-zA-Z0-9_.\-]+$/.test(pickerRepo.owner)) return;
    if (!pickerRepo.name || !/^[a-zA-Z0-9_.\-]+$/.test(pickerRepo.name)) return;
    if (!branch || branch.includes('..') || branch.includes('\0')) return;
    const installationId = parseInt(String(pickerRepo.installationId), 10);
    if (!Number.isFinite(installationId) || installationId <= 0) return;
    const qs = new URLSearchParams({
      owner: pickerRepo.owner,
      repo: pickerRepo.name,
      branch,
      installationId: String(installationId),
    });
    router.push(`/${locale}/app/translations?${qs}`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">{t("projects")}</h1>
        <Button size="sm" className="gap-1.5" asChild>
          <a href={installUrl(locale)} target="_blank" rel="noopener noreferrer">
            <Plus className="h-4 w-4" />
            Add Repository
          </a>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--color-muted-foreground)]" />
        </div>
      ) : repos.length === 0 ? (
        <EmptyState locale={locale} />
      ) : (
        <RepoGrid repos={repos} onOpenRepo={setPickerRepo} />
      )}

      {pickerRepo && (
        <BranchPicker
          repo={pickerRepo}
          open={pickerRepo !== null}
          onOpenChange={(open) => { if (!open) setPickerRepo(null); }}
          onSelect={handleBranchSelect}
        />
      )}
    </div>
  );
}

function EmptyState({ locale }: { locale: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--color-surface-container-high)] mb-4">
        <FolderOpen className="h-6 w-6 text-[var(--color-muted-foreground)]" />
      </div>
      <p className="text-sm font-medium mb-1">No repositories connected</p>
      <p className="text-xs text-[var(--color-muted-foreground)] max-w-xs leading-relaxed mb-6">
        Install the GitHub App to grant Loki access to your repositories.
        You choose which repos and what permissions to grant.
      </p>
      <div className="flex flex-col items-center gap-3">
        <Button asChild>
          <a
            href={installUrl(locale)}
            target="_blank"
            rel="noopener noreferrer"
            className="gap-2"
          >
            <GitBranch className="h-4 w-4" />
            Install GitHub App
            <ExternalLink className="h-3 w-3 opacity-70" />
          </a>
        </Button>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          After installing, come back here — your repos will appear automatically.
        </p>
      </div>
    </div>
  );
}

function RepoGrid({ repos, onOpenRepo }: { repos: GithubRepo[]; onOpenRepo: (repo: GithubRepo) => void }) {
  const canWrite = (r: GithubRepo) => r.permissions.contents === "write";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {repos.map((repo) => (
        <button
          key={repo.id}
          onClick={() => onOpenRepo(repo)}
          className="block rounded bg-[var(--color-card)] p-4 hover:bg-[var(--color-surface-container-high)] transition-colors group text-left"
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              {repo.private ? (
                <Lock className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
              ) : (
                <Globe className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
              )}
              <span className="font-mono text-sm font-medium truncate">
                {repo.name}
              </span>
            </div>
            {canWrite(repo) ? null : (
              <Badge variant="permission" className="shrink-0">
                Read-only
              </Badge>
            )}
          </div>

          <p className="text-xs text-[var(--color-muted-foreground)] mb-3">
            {repo.owner}
          </p>

          <div className="flex items-center gap-2">
            <GitBranch className="h-3 w-3 text-[var(--color-muted-foreground)]" />
            <span className="font-mono text-xs text-[var(--color-muted-foreground)]">
              {repo.defaultBranch}
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)]">
            <span className="text-xs text-[var(--color-primary)] group-hover:underline">
              Open translations →
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
