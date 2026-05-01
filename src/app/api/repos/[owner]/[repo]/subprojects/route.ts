import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireActiveOrg, withErrorHandling } from "@/lib/org-access";

export const runtime = "nodejs";

/**
 * GET /api/repos/[owner]/[repo]/subprojects?branch=main
 * Returns the SubProject rows persisted for the active org, ordered by
 * shallowest rootPath first.
 */
export const GET = withErrorHandling(async (
  req: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) => {
  const ctx = await requireActiveOrg();
  const { owner, repo } = await params;
  const branch = req.nextUrl.searchParams.get("branch") ?? "main";

  const rows = await db.subProject.findMany({
    where: { orgId: ctx.orgId, repoOwner: owner, repoName: repo, branch },
    orderBy: [{ rootPath: "asc" }],
  });

  return NextResponse.json({
    subProjects: rows.map((r) => ({
      id: r.id,
      name: r.name,
      rootPath: r.rootPath,
      files: JSON.parse(r.filePaths) as string[],
      detectedAt: r.detectedAt,
    })),
  });
});
