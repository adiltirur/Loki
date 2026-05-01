import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperAdmin, requireUser, withErrorHandling } from "@/lib/org-access";

export const runtime = "nodejs";

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  if (user.role === "super_admin") {
    const orgs = await db.organization.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { members: true } } },
    });
    return NextResponse.json({
      orgs: orgs.map((o) => ({
        id: o.id,
        name: o.name,
        slug: o.slug,
        createdAt: o.createdAt,
        memberCount: o._count.members,
      })),
    });
  }
  const memberships = await db.orgMember.findMany({
    where: { userId: user.id },
    include: { org: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({
    orgs: memberships.map((m) => ({
      id: m.org.id,
      name: m.org.name,
      slug: m.org.slug,
      role: m.role,
    })),
  });
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await requireSuperAdmin();
  const body = (await req.json().catch(() => null)) as { name?: string; slug?: string } | null;
  const name = body?.name?.trim();
  const slug = body?.slug?.trim().toLowerCase();
  if (!name || !slug) {
    return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
  }
  if (!SLUG_RE.test(slug)) {
    return NextResponse.json({ error: "Invalid slug (a-z, 0-9, dashes; 1-40 chars)" }, { status: 400 });
  }
  const existing = await db.organization.findUnique({ where: { slug }, select: { id: true } });
  if (existing) {
    return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
  }
  const org = await db.organization.create({
    data: {
      name,
      slug,
      members: { create: { userId: user.id, role: "admin" } },
    },
  });
  return NextResponse.json({ org: { id: org.id, name: org.name, slug: org.slug } }, { status: 201 });
});
