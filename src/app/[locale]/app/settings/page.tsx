import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getInstallationsForOrg } from "@/lib/installation-store";
import { listReposForInstallation, type GithubRepo } from "@/lib/github";
import { SettingsTabs } from "@/app/[locale]/app/settings/settings-tabs";

interface SettingsRepo {
  owner: string;
  name: string;
  defaultBranch: string | null;
  lastScannedBranch: string | null;
  lastScannedAt: string | null;
}

async function loadOrgRepos(orgId: string): Promise<SettingsRepo[]> {
  const installationIds = await getInstallationsForOrg(orgId);
  if (installationIds.length === 0) return [];
  const lists = await Promise.all(
    installationIds.map((id) =>
      listReposForInstallation(id).catch(() => [] as GithubRepo[])
    )
  );
  const repos: GithubRepo[] = lists.flat();
  // Latest scan per repo (any branch).
  const scans = await db.repoScan.findMany({
    where: {
      orgId,
      OR: repos.map((r) => ({ owner: r.owner, repo: r.name })),
    },
    orderBy: { scannedAt: "desc" },
  });
  const lastByRepo = new Map<string, { branch: string; scannedAt: Date }>();
  for (const s of scans) {
    const k = `${s.owner}/${s.repo}`;
    if (!lastByRepo.has(k)) lastByRepo.set(k, { branch: s.branch, scannedAt: s.scannedAt });
  }
  return repos.map((r) => {
    const last = lastByRepo.get(`${r.owner}/${r.name}`);
    return {
      owner: r.owner,
      name: r.name,
      defaultBranch: r.defaultBranch ?? null,
      lastScannedBranch: last?.branch ?? null,
      lastScannedAt: last?.scannedAt.toISOString() ?? null,
    };
  });
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const repos = session.activeOrgId ? await loadOrgRepos(session.activeOrgId) : [];

  let orgRole: "admin" | "member" | null = null;
  if (session.activeOrgId && session.user.role !== "super_admin") {
    const member = await db.orgMember.findUnique({
      where: { userId_orgId: { userId: session.user.id, orgId: session.activeOrgId } },
      select: { role: true },
    });
    orgRole = (member?.role as "admin" | "member" | undefined) ?? null;
  }
  const canManageOrg = session.user.role === "super_admin" || orgRole === "admin";

  return (
    <SettingsTabs
      locale={locale}
      session={{
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
        role: session.user.role,
        githubLogin: session.user.githubLogin,
      }}
      activeOrgId={session.activeOrgId}
      canManageOrg={canManageOrg}
      repos={repos}
    />
  );
}
