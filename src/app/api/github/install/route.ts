import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { addInstallation } from "@/lib/installation-store";
import { LOKI_DEFAULT_LOCALE } from "@/lib/constants";

export const runtime = "nodejs";

/**
 * GitHub redirects here after a user installs the GitHub App.
 * URL: /api/github/install?installation_id=123&setup_action=install
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL(`/${LOKI_DEFAULT_LOCALE}/login`, req.url));
  }

  const installationId = req.nextUrl.searchParams.get("installation_id");
  const setupAction = req.nextUrl.searchParams.get("setup_action");

  if (installationId && setupAction !== "delete") {
    addInstallation(session.user.id, Number(installationId));
  } else if (installationId && setupAction === "delete") {
    const { removeInstallation } = await import("@/lib/installation-store");
    removeInstallation(session.user.id, Number(installationId));
  }

  return NextResponse.redirect(
    new URL(`/${LOKI_DEFAULT_LOCALE}/app/projects`, req.url)
  );
}
