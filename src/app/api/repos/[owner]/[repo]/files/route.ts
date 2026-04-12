import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getInstallations } from "@/lib/installation-store";
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
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { owner, repo } = await params;
  const path = req.nextUrl.searchParams.get("path");
  const branch = req.nextUrl.searchParams.get("branch") ?? "main";
  const installationIdParam = req.nextUrl.searchParams.get("installationId");

  if (!path) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  const installationIds = installationIdParam
    ? [Number(installationIdParam)]
    : await getInstallations(session.user.id);

  let lastError: unknown;
  for (const installationId of installationIds) {
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
