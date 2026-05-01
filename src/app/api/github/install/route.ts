import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { addInstallation, removeInstallation } from "@/lib/installation-store";
import { LOKI_DEFAULT_LOCALE } from "@/lib/constants";

export const runtime = "nodejs";

/**
 * GitHub redirects here after a user installs the GitHub App.
 * URL: /api/github/install?installation_id=123&setup_action=install&state=<orgId>
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL(`/${LOKI_DEFAULT_LOCALE}/login`, req.url));
  }

  const installationId = req.nextUrl.searchParams.get("installation_id");
  const setupAction = req.nextUrl.searchParams.get("setup_action");
  const stateOrgId = req.nextUrl.searchParams.get("state");

  // Validate orgId from state (if provided): must be an org the user belongs to,
  // or the user must be a super_admin. Fall back to no org binding otherwise.
  let orgId: string | null = null;
  if (stateOrgId) {
    if (session.user.role === "super_admin") {
      const exists = await db.organization.findUnique({ where: { id: stateOrgId }, select: { id: true } });
      if (exists) orgId = stateOrgId;
    } else {
      const member = await db.orgMember.findUnique({
        where: { userId_orgId: { userId: session.user.id, orgId: stateOrgId } },
        select: { id: true },
      });
      if (member) orgId = stateOrgId;
    }
  }
  if (!orgId && session.activeOrgId) orgId = session.activeOrgId;

  if (installationId && setupAction !== "delete") {
    await addInstallation({
      userId: session.user.id,
      installationId: Number(installationId),
      orgId,
    });
  } else if (installationId && setupAction === "delete") {
    await removeInstallation(session.user.id, Number(installationId));
  }

  return NextResponse.redirect(
    new URL(`/${LOKI_DEFAULT_LOCALE}/app/settings`, req.url)
  );
}
