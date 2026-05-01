import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOrgAdmin, withErrorHandling } from "@/lib/org-access";
import { sendInviteEmail } from "@/lib/email";
import { isOrgRole } from "@/lib/roles";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST = withErrorHandling(async (
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) => {
  const { orgId } = await params;
  const ctx = await requireOrgAdmin(orgId);
  const body = (await req.json().catch(() => null)) as { email?: string; role?: string } | null;
  const email = body?.email?.trim().toLowerCase();
  const role = body?.role ?? "member";
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  if (!isOrgRole(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const org = await db.organization.findUnique({ where: { id: orgId } });
  if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

  // Already a member?
  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    const already = await db.orgMember.findUnique({
      where: { userId_orgId: { userId: existingUser.id, orgId } },
    });
    if (already) {
      return NextResponse.json({ error: "User is already a member" }, { status: 409 });
    }
  }

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
  const invite = await db.orgInvite.create({
    data: { orgId, email, role, expiresAt },
  });

  const baseUrl = process.env.AUTH_URL ?? new URL(req.url).origin;
  const inviteUrl = `${baseUrl}/api/invite/${invite.token}`;

  const inviter = await db.user.findUnique({ where: { id: ctx.user.id }, select: { name: true, email: true } });
  await sendInviteEmail({
    to: email,
    orgName: org.name,
    inviteUrl,
    inviterName: inviter?.name ?? inviter?.email ?? null,
  });

  return NextResponse.json(
    {
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
      },
    },
    { status: 201 }
  );
});
