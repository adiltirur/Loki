import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getInstallations } from "@/lib/installation-store";
import { getInstallationOctokit } from "@/lib/github";

export const runtime = "nodejs";

/**
 * GET /api/repos/[owner]/[repo]/branches?installationId=N
 * Lists branches for a repository.
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

  let installationIds: number[];
  if (installationIdParam) {
    installationIds = [parseInt(installationIdParam, 10)];
  } else {
    installationIds = await getInstallations(session.user.id);
  }

  if (installationIds.length === 0) {
    return NextResponse.json({ error: "No GitHub App installed" }, { status: 403 });
  }

  let lastError: unknown;
  for (const installationId of installationIds) {
    try {
      const octokit = await getInstallationOctokit(installationId);
      const { data } = await octokit.repos.listBranches({
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
