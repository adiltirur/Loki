import { NextRequest, NextResponse } from "next/server";
import { resolveInstallationAccess } from "@/lib/installation-access";
import { getInstallationOctokit } from "@/lib/github";

export const runtime = "nodejs";

/**
 * GET /api/repos/[owner]/[repo]/branches?installationId=N
 * Lists all branches for a repository (paginated via Octokit).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const { owner, repo } = await params;
  const installationIdParam = req.nextUrl.searchParams.get("installationId");
  const requested = installationIdParam ? parseInt(installationIdParam, 10) : null;

  const access = await resolveInstallationAccess(requested);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status ?? 403 });
  }

  let lastError: unknown;
  for (const installationId of access.installationIds) {
    try {
      const octokit = await getInstallationOctokit(installationId);
      await octokit.repos.get({ owner, repo });
      const branches = await octokit.paginate(octokit.repos.listBranches, { owner, repo });
      return NextResponse.json({ branches: branches.map((b) => b.name) });
    } catch (err) {
      lastError = err;
    }
  }

  console.error("Failed to list branches:", lastError);
  return NextResponse.json(
    { error: "Could not list branches. Check GitHub App installation." },
    { status: 404 }
  );
}
