import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOrgAdmin, withErrorHandling } from "@/lib/org-access";

export const runtime = "nodejs";

export const GET = withErrorHandling(async (
  _req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) => {
  const { orgId } = await params;
  await requireOrgAdmin(orgId);
  const members = await db.orgMember.findMany({
    where: { orgId },
    include: { user: { select: { id: true, email: true, name: true, image: true, githubLogin: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({
    members: members.map((m) => ({
      id: m.id,
      role: m.role,
      seats: m.seats,
      createdAt: m.createdAt,
      user: m.user,
    })),
  });
});
