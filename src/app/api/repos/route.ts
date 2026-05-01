import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getInstallations, getInstallationsForOrg } from "@/lib/installation-store";
import { listReposForInstallation } from "@/lib/github";

export const runtime = "nodejs";

/**
 * GET /api/repos
 * Lists all repositories accessible to the active org via its GitHub App
 * installations. Super admins without an active org fall back to their own
 * personal installations.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const installationIds = session.activeOrgId
    ? await getInstallationsForOrg(session.activeOrgId)
    : session.user.role === "super_admin"
      ? await getInstallations(session.user.id)
      : [];

  if (installationIds.length === 0) {
    return NextResponse.json({ repos: [] });
  }

  const allRepos = await Promise.all(
    installationIds.map((id) =>
      listReposForInstallation(id).catch((err) => {
        console.error(`Failed to list repos for installation ${id}:`, err);
        return [];
      })
    )
  );

  return NextResponse.json({ repos: allRepos.flat() });
}
