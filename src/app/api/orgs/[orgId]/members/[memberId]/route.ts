import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { HttpError, requireOrgAdmin, requireSuperAdmin, withErrorHandling } from "@/lib/org-access";

export const runtime = "nodejs";

export const PATCH = withErrorHandling(async (
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string; memberId: string }> }
) => {
  const { orgId, memberId } = await params;
  await requireSuperAdmin();
  const member = await db.orgMember.findUnique({ where: { id: memberId } });
  if (!member || member.orgId !== orgId) throw new HttpError(404, "Member not found");
  const body = (await req.json().catch(() => null)) as { seats?: number } | null;
  if (typeof body?.seats !== "number" || body.seats < 0 || body.seats > 1000 || !Number.isInteger(body.seats)) {
    return NextResponse.json({ error: "seats must be a non-negative integer" }, { status: 400 });
  }
  const updated = await db.orgMember.update({
    where: { id: memberId },
    data: { seats: body.seats },
  });
  return NextResponse.json({ member: { id: updated.id, seats: updated.seats } });
});

export const DELETE = withErrorHandling(async (
  _req: NextRequest,
  { params }: { params: Promise<{ orgId: string; memberId: string }> }
) => {
  const { orgId, memberId } = await params;
  await requireOrgAdmin(orgId);
  const member = await db.orgMember.findUnique({ where: { id: memberId } });
  if (!member || member.orgId !== orgId) throw new HttpError(404, "Member not found");
  await db.orgMember.delete({ where: { id: memberId } });
  return NextResponse.json({ ok: true });
});
