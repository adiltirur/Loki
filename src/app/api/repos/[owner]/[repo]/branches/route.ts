import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getInstallations } from "@/lib/installation-store";
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
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { owner, repo } = await params;
  const installationIdParam = req.nextUrl.searchParams.get("installationId");

  // Always fetch the user's own installations for access control
  const userInstallations = await getInstallations(session.user.id);

  if (userInstallations.length === 0) {
    return NextResponse.json({ error: "No GitHub App installed" }, { status: 403 });
  }

  let installationIds: number[];
  if (installationIdParam) {
    const parsed = parseInt(installationIdParam, 10);
    // Verify the requested installation actually belongs to this user
    if (!userInstallations.includes(parsed)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    installationIds = [parsed];
  } else {
    installationIds = userInstallations;
  }

  let lastError: unknown;
  for (const installationId of installationIds) {
    try {
      const octokit = await getInstallationOctokit(installationId);
      // Verify this installation can access the specific repo. repos.get() uses
      // the installation token which is scoped to only repos granted to this
      // installation — GitHub returns 404 if owner/repo is not in scope, which
      // is caught below and causes the loop to try the next installation.
      await octokit.repos.get({ owner, repo });
      // per_page: 100 is the page size per request; octokit.paginate
      // automatically fetches all pages until GitHub returns no more results.
      const data = await octokit.paginate(octokit.repos.listBranches, {
        owner,
        repo,
        per_page: 100,
      });
      const branches = data.map((b) => b.name);
      return NextResponse.json({ branches });
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
