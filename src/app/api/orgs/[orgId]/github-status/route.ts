import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOrgMember, withErrorHandling } from "@/lib/org-access";

export const runtime = "nodejs";

export const GET = withErrorHandling(async (
  _req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) => {
  const { orgId } = await params;
  await requireOrgMember(orgId);
  const installation = await db.installation.findFirst({
    where: { orgId },
    orderBy: { createdAt: "desc" },
  });
  if (!installation) {
    return NextResponse.json({ connected: false, installationId: null, installedBy: null });
  }
  const installer = await db.user.findUnique({
    where: { id: installation.userId },
    select: { name: true, email: true, githubLogin: true },
  });
  return NextResponse.json({
    connected: true,
    installationId: installation.installationId,
    installedBy: installer?.githubLogin ?? installer?.name ?? installer?.email ?? null,
  });
});
