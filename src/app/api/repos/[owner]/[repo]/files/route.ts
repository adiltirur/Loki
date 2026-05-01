import { NextRequest, NextResponse } from "next/server";
import { resolveInstallationAccess } from "@/lib/installation-access";
import { getFileContent } from "@/lib/github";

export const runtime = "nodejs";

/**
 * GET /api/repos/[owner]/[repo]/files?path=locales/en.json&branch=main&installationId=123
 * Returns parsed key-value entries for a localization file.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const { owner, repo } = await params;
  const path = req.nextUrl.searchParams.get("path");
  const branch = req.nextUrl.searchParams.get("branch") ?? "main";
  const installationIdParam = req.nextUrl.searchParams.get("installationId");

  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });

  const requested = installationIdParam ? parseInt(installationIdParam, 10) : null;
  const access = await resolveInstallationAccess(requested);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status ?? 403 });
  }

  let lastError: unknown;
  for (const installationId of access.installationIds) {
    try {
      const content = await getFileContent(installationId, owner, repo, path, branch);
      return NextResponse.json({ ...content, installationId });
    } catch (err) {
      lastError = err;
    }
  }

  console.error("getFileContent failed:", lastError);
  return NextResponse.json({ error: "Could not fetch file" }, { status: 404 });
}
