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
      // Two-layer authorization:
      // 1. installationId ownership was verified above via getInstallations(session.user.id)
      // 2. repos.get() confirms this installation has explicit access to the
      //    requested owner/repo — GitHub returns 404 if the repo is not in the
      //    installation's granted scope, causing the catch below to try the next id.
      await octokit.repos.get({ owner, repo });
      // octokit.paginate exhausts all pages automatically — no branch count cap.
      const data = await octokit.paginate(octokit.repos.listBranches, {
        owner,
        repo,
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
