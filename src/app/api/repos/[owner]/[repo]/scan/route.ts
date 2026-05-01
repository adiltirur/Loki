import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { resolveInstallationAccess } from "@/lib/installation-access";
import { scanRepo } from "@/lib/github";
import { detectSubProjects } from "@/lib/subproject-detector";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/**
 * GET /api/repos/[owner]/[repo]/scan?branch=main
 * Scans the repo for localization files (.arb, .json) and persists a
 * RepoScan + SubProject records scoped to the active org.
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

  const access = await resolveInstallationAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status ?? 403 });
  }

  let lastError: unknown;
  for (const installationId of access.installationIds) {
    try {
      const files = await scanRepo(installationId, owner, repo, branch);
      const filePaths = files.map((f) => f.path);
      const subProjects = detectSubProjects(filePaths);

      await db.repoScan.upsert({
        where: { userId_owner_repo_branch: { userId: session.user.id, owner, repo, branch } },
        update: {
          orgId: access.orgId,
          fileCount: files.length,
          filePaths: JSON.stringify(filePaths),
          scannedAt: new Date(),
        },
        create: {
          userId: session.user.id,
          orgId: access.orgId,
          owner,
          repo,
          branch,
          fileCount: files.length,
          filePaths: JSON.stringify(filePaths),
        },
      });

      if (access.orgId) {
        await Promise.all(
          subProjects.map((sp) =>
            db.subProject.upsert({
              where: {
                orgId_repoOwner_repoName_branch_rootPath: {
                  orgId: access.orgId!,
                  repoOwner: owner,
                  repoName: repo,
                  branch,
                  rootPath: sp.rootPath,
                },
              },
              update: {
                name: sp.name,
                filePaths: JSON.stringify(sp.files),
                detectedAt: new Date(),
              },
              create: {
                orgId: access.orgId!,
                repoOwner: owner,
                repoName: repo,
                branch,
                name: sp.name,
                rootPath: sp.rootPath,
                filePaths: JSON.stringify(sp.files),
              },
            })
          )
        );
      }

      return NextResponse.json({ files, installationId, subProjects });
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
