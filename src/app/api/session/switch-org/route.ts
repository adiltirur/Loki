import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, withErrorHandling } from "@/lib/org-access";
import { updateSession } from "@/auth";

export const runtime = "nodejs";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await requireUser();
  const body = (await req.json().catch(() => null)) as { orgId?: string } | null;
  const orgId = body?.orgId;
  if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });

  if (user.role !== "super_admin") {
    const member = await db.orgMember.findUnique({
      where: { userId_orgId: { userId: user.id, orgId } },
      select: { id: true },
    });
    if (!member) return NextResponse.json({ error: "Not a member of this organization" }, { status: 403 });
  } else {
    const exists = await db.organization.findUnique({ where: { id: orgId }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  await updateSession({ activeOrgId: orgId });
  return NextResponse.json({ ok: true, activeOrgId: orgId });
});
