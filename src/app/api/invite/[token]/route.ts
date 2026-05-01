import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { LOKI_DEFAULT_LOCALE } from "@/lib/constants";
import { isOrgRole } from "@/lib/roles";

export const runtime = "nodejs";

/**
 * GET /api/invite/[token] — accept an org invite.
 *
 * Flow: requires the user to be signed in with the same email the invite was
 * sent to (or be a super_admin). On success, creates the OrgMember row,
 * deletes the invite, and redirects into the app.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    const back = encodeURIComponent(`/api/invite/${token}`);
    return NextResponse.redirect(
      new URL(`/${LOKI_DEFAULT_LOCALE}/login?next=${back}`, req.url)
    );
  }

  const invite = await db.orgInvite.findUnique({
    where: { token },
    include: { org: true },
  });
  if (!invite) {
    return NextResponse.redirect(
      new URL(`/${LOKI_DEFAULT_LOCALE}/app?invite=invalid`, req.url)
    );
  }
  if (invite.expiresAt < new Date()) {
    await db.orgInvite.delete({ where: { id: invite.id } }).catch(() => {});
    return NextResponse.redirect(
      new URL(`/${LOKI_DEFAULT_LOCALE}/app?invite=expired`, req.url)
    );
  }

  const sessionEmail = session.user.email.toLowerCase();
  if (sessionEmail !== invite.email && session.user.role !== "super_admin") {
    return NextResponse.redirect(
      new URL(`/${LOKI_DEFAULT_LOCALE}/app?invite=mismatch`, req.url)
    );
  }

  const role = isOrgRole(invite.role) ? invite.role : "member";
  await db.orgMember.upsert({
    where: { userId_orgId: { userId: session.user.id, orgId: invite.orgId } },
    update: { role },
    create: { userId: session.user.id, orgId: invite.orgId, role },
  });
  await db.orgInvite.delete({ where: { id: invite.id } }).catch(() => {});

  return NextResponse.redirect(
    new URL(`/${LOKI_DEFAULT_LOCALE}/app?org=${invite.org.slug}`, req.url)
  );
}
