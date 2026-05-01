import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperAdmin, withErrorHandling } from "@/lib/org-access";

export const runtime = "nodejs";

export const GET = withErrorHandling(async () => {
  await requireSuperAdmin();
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { orgMembers: { include: { org: { select: { name: true, slug: true } } } } },
  });
  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      image: u.image,
      githubLogin: u.githubLogin,
      role: u.role,
      createdAt: u.createdAt,
      orgs: u.orgMembers.map((m) => ({ name: m.org.name, slug: m.org.slug, role: m.role })),
    })),
  });
});
