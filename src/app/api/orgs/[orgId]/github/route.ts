import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOrgAdmin, withErrorHandling } from "@/lib/org-access";

export const runtime = "nodejs";

export const DELETE = withErrorHandling(async (
  _req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) => {
  const { orgId } = await params;
  await requireOrgAdmin(orgId);
  // Detach the installation from the org without removing the row,
  // so the user keeps their personal GitHub App install for any other orgs.
  const result = await db.installation.updateMany({
    where: { orgId },
    data: { orgId: null },
  });
  return NextResponse.json({ disconnected: result.count });
});
