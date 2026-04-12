import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getInstallations } from "@/lib/installation-store";
import { scanRepo } from "@/lib/github";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/**
 * GET /api/repos/[owner]/[repo]/scan?branch=main
 * Scans the repo for localization files (.arb, .json) without AI.
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
  const branch = req.nextUrl.searchParams.get("branch") ?? "main";

  const installationIds = await getInstallations(session.user.id);
  if (installationIds.length === 0) {
    return NextResponse.json({ error: "No GitHub App installed" }, { status: 403 });
  }

  // Try each installation until one succeeds (repo may be under any installation)
  let lastError: unknown;
  for (const installationId of installationIds) {
    try {
      const files = await scanRepo(installationId, owner, repo, branch);
      const userId = session.user.id;
      await db.repoScan.upsert({
        where: { userId_owner_repo_branch: { userId, owner, repo, branch } },
        update: { installationId, fileCount: files.length, filePaths: JSON.stringify(files.map((f) => f.path)), scannedAt: new Date() },
        create: { userId, installationId, owner, repo, branch, fileCount: files.length, filePaths: JSON.stringify(files.map((f) => f.path)) },
      });
      return NextResponse.json({ files, installationId });
    } catch (err) {
      lastError = err;
    }
  }

  console.error("Scan failed for all installations:", lastError);
  return NextResponse.json(
    { error: "Could not access repository. Check GitHub App installation." },
    { status: 404 }
  );
}
