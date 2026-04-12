import { useTranslations } from "next-intl";
import { Globe, GitPullRequest, Sparkles, FileCode2, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { listReposForInstallation } from "@/lib/github";
import type { GithubRepo } from "@/lib/github";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="p-4 hover:bg-[var(--color-surface-container-high)]">
      <CardContent className="p-0">
        <div className="flex items-start justify-between mb-2">
          <p className="label-caps text-[var(--color-muted-foreground)]">{label}</p>
          <Icon className="h-4 w-4 text-[var(--color-muted-foreground)]" />
        </div>
        <p className="text-3xl font-semibold text-[var(--color-primary)]">{value}</p>
        {sub && (
          <p className="text-xs text-[var(--color-muted-foreground)] mt-1">{sub}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface ScanStat {
  owner: string;
  repo: string;
  branch: string;
  fileCount: number;
  scannedAt: Date;
}

function DashboardContent({
  locale,
  repos,
  scanStats,
}: {
  locale: string;
  repos: GithubRepo[];
  scanStats: ScanStat[];
}) {
  const t = useTranslations("app.dashboard");

  const repoDefaultBranches = new Map(repos.map((r) => [`${r.owner}/${r.name}`, r.defaultBranch]));
  const defaultBranchStats = scanStats.filter(
    (s) => repoDefaultBranches.get(`${s.owner}/${s.repo}`) === s.branch
  );
  const totalFiles = defaultBranchStats.reduce((sum, s) => sum + s.fileCount, 0);

  const stats = [
    { label: t("totalKeys"), value: String(repos.length), sub: repos.length === 1 ? "repository" : "repositories", icon: Globe },
    { label: t("missingTranslations"), value: String(totalFiles), sub: "l10n files found", icon: FileCode2 },
    { label: t("pendingPRs"), value: "0", sub: "Coming soon", icon: GitPullRequest },
    { label: t("aiSuggestions"), value: "0", sub: "Coming soon", icon: Sparkles },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Active Projects */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Active Projects</h2>
          <Link href={`/${locale}/app/projects`} className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1">
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        {repos.length === 0 ? (
          <div className="rounded bg-[var(--color-card)] p-6 text-center">
            <p className="text-sm text-[var(--color-muted-foreground)]">No repositories connected yet.</p>
            <Link href={`/${locale}/app/projects`} className="mt-2 inline-block text-xs text-[var(--color-primary)] hover:underline">
              Install the GitHub App to get started
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {repos.slice(0, 5).map((repo) => {
              const scan = scanStats.find((s) => s.owner === repo.owner && s.repo === repo.name && s.branch === repo.defaultBranch);
              return (
                <div
                  key={`${repo.owner}/${repo.name}`}
                  className="rounded bg-[var(--color-card)] p-4 flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium font-mono truncate">{repo.name}</p>
                      <Badge variant="language">{repo.defaultBranch}</Badge>
                      {!repo.permissions.contents && (
                        <Badge variant="destructive">Read-only</Badge>
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      {repo.owner}
                      {scan ? ` · ${scan.fileCount} l10n file${scan.fileCount !== 1 ? "s" : ""} found` : " · Not scanned yet"}
                    </p>
                  </div>
                  <Button size="sm" asChild>
                    <Link
                      href={`/${locale}/app/translations?owner=${repo.owner}&repo=${repo.name}&branch=${repo.defaultBranch}&installationId=${repo.installationId}`}
                    >
                      {t("openEditor")}
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Recent Activity</h2>
        {scanStats.length === 0 ? (
          <div className="rounded bg-[var(--color-card)] p-4">
            <p className="text-xs text-[var(--color-muted-foreground)]">No activity yet. Scan a repository to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {scanStats.slice(0, 5).map((scan) => (
              <div
                key={`${scan.owner}/${scan.repo}/${scan.branch}`}
                className="flex items-start gap-3 rounded bg-[var(--color-card)] p-3"
              >
                <div className="mt-1.5 h-2 w-2 rounded-full shrink-0 bg-[var(--color-success)]" />
                <div>
                  <p className="text-xs font-medium">
                    Scanned {scan.owner}/{scan.repo} — {scan.fileCount} l10n file{scan.fileCount !== 1 ? "s" : ""} found
                  </p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {scan.branch} · {scan.scannedAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  let repos: GithubRepo[] = [];
  let scanStats: ScanStat[] = [];

  if (session?.user?.id) {
    const installations = await db.installation.findMany({
      where: { userId: session.user.id },
      select: { installationId: true },
    });

    if (installations.length > 0) {
      const repoResults = await Promise.allSettled(
        installations.map((inst) => listReposForInstallation(inst.installationId))
      );
      repos = repoResults
        .filter((r): r is PromiseFulfilledResult<GithubRepo[]> => r.status === "fulfilled")
        .flatMap((r) => r.value);

      const repoKeys = new Set(repos.map((r) => `${r.owner}/${r.name}`));
      const scans = await db.repoScan.findMany({
        where: { userId: session.user.id },
        orderBy: { scannedAt: "desc" },
      });
      scanStats = scans
        .filter((s) => repoKeys.has(`${s.owner}/${s.repo}`))
        .map((s) => ({
          owner: s.owner,
          repo: s.repo,
          branch: s.branch,
          fileCount: s.fileCount,
          scannedAt: s.scannedAt,
        }));
    }
  }

  return <DashboardContent locale={locale} repos={repos} scanStats={scanStats} />;
}
