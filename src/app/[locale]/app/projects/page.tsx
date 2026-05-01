"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  FolderOpen,
  Lock,
  Globe,
  GitBranch,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BranchPicker } from "@/components/loki/branch-picker";
import { SubProjectPicker, type SubProjectOption } from "@/components/loki/subproject-picker";
import { EmptyState } from "@/components/loki/empty-state";
import { RepoCardSkeleton } from "@/components/loki/skeletons";
import { useTopbarConfig } from "@/components/loki/topbar-context";
import type { GithubRepo } from "@/lib/github";

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
  const [subProjectRepo, setSubProjectRepo] = useState<GithubRepo | null>(null);
  const [pickerRepo, setPickerRepo] = useState<{ repo: GithubRepo; subProject: SubProjectOption | null } | null>(null);

  useTopbarConfig({ breadcrumbs: [t("projects")] });

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

  function handleSubProjectChosen(subProject: SubProjectOption | null) {
    if (!subProjectRepo) return;
    setPickerRepo({ repo: subProjectRepo, subProject });
    setSubProjectRepo(null);
  }

  function handleBranchSelect(branch: string) {
    if (!pickerRepo) return;
    const { repo, subProject } = pickerRepo;
    if (!repo.owner || !/^[a-zA-Z0-9_-]+$/.test(repo.owner)) return;
    if (!repo.name || !/^[a-zA-Z0-9_.\-]+$/.test(repo.name)) return;
    if (!branch || branch.includes("..") || branch.includes("\0") || /[\x00-\x1f\x7f]/.test(branch)) return;
    const installationId = parseInt(String(repo.installationId), 10);
    if (!Number.isFinite(installationId) || installationId <= 0) return;

    const qs = new URLSearchParams({
      owner: repo.owner,
      repo: repo.name,
      branch,
      installationId: String(installationId),
    });
    if (subProject) {
      qs.set("subProjectRootPath", subProject.rootPath);
      qs.set("subProjectName", subProject.name);
    }
    router.push(`/${locale}/app/translations?${qs.toString()}`);
  }

  return (
    <div>
      <h1 className="text-lg font-semibold mb-6">{t("projects")}</h1>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <RepoCardSkeleton key={i} />
          ))}
        </div>
      ) : repos.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No repositories connected"
          description="Connect GitHub from Settings → Integrations to grant access to repositories on this organization."
          action={{ label: "Open Settings", href: `/${locale}/app/settings` }}
        />
      ) : (
        <RepoGrid repos={repos} onOpenRepo={setSubProjectRepo} />
      )}

      {subProjectRepo && (
        <SubProjectPicker
          owner={subProjectRepo.owner}
          repo={subProjectRepo.name}
          branch={subProjectRepo.defaultBranch ?? "main"}
          open={subProjectRepo !== null}
          onOpenChange={(open) => {
            if (!open) setSubProjectRepo(null);
          }}
          onSelect={handleSubProjectChosen}
        />
      )}

      {pickerRepo && (
        <BranchPicker
          repo={pickerRepo.repo}
          open={pickerRepo !== null}
          onOpenChange={(open) => {
            if (!open) setPickerRepo(null);
          }}
          onSelect={handleBranchSelect}
        />
      )}
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
          className="block rounded bg-[var(--color-card)] p-4 hover:bg-[var(--color-surface-container-high)] transition-colors group text-left focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2"
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              {repo.private ? (
                <Lock className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
              ) : (
                <Globe className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
              )}
              <span className="font-mono text-sm font-medium truncate">{repo.name}</span>
            </div>
            {canWrite(repo) ? null : (
              <Badge variant="permission" className="shrink-0">Read-only</Badge>
            )}
          </div>

          <p className="text-xs text-[var(--color-muted-foreground)] mb-3">{repo.owner}</p>

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
