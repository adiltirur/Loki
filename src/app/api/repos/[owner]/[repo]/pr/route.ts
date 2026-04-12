import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createPR, serializeEntries } from "@/lib/github";
import type { L10nEntry } from "@/lib/github";
import { lokiBranchName } from "@/lib/utils";
import { LOKI_PR_DESCRIPTION_TEMPLATE } from "@/lib/constants";

export const runtime = "nodejs";

interface StatusCounts {
  approved: number;
  pending_review: number;
  rejected: number;
  unreviewed: number;
}

interface PRRequestBody {
  installationId: number;
  baseBranch: string;
  ticketUrl?: string;
  prTitle?: string;
  files: Array<{
    path: string;
    entries: L10nEntry[];
    raw: Record<string, unknown>;
    format: "arb" | "json";
  }>;
  lockFile?: {
    path: string;
    content: string;
  };
  statusCounts: StatusCounts;
}

/**
 * POST /api/repos/[owner]/[repo]/pr
 * Creates a branch and opens a PR with the translation changes.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { owner, repo } = await params;
  const body: PRRequestBody = await req.json();
  const { installationId, baseBranch, ticketUrl, prTitle, files, lockFile, statusCounts } = body;

  if (!files?.length) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  if (!statusCounts || typeof statusCounts.approved !== "number") {
    return NextResponse.json({ error: "statusCounts is required" }, { status: 400 });
  }

  const newBranch = lokiBranchName();
  const changedKeyCount = files.reduce((n, f) => n + f.entries.length, 0);
  const fileList = files.map((f) => f.path).join(", ");

  const title = prTitle ?? `chore(i18n): update ${changedKeyCount} translation key${changedKeyCount !== 1 ? "s" : ""}`;

  const approvalLine = `\nApproved: ${statusCounts.approved} | Pending: ${statusCounts.pending_review} | Rejected: ${statusCounts.rejected} | Unreviewed: ${statusCounts.unreviewed}`;

  const prBody = LOKI_PR_DESCRIPTION_TEMPLATE
    .replace("{count}", String(changedKeyCount))
    .replace("{files}", fileList)
    .replace("{ticket}", ticketUrl || "—")
    .replace("{approvalStats}", approvalLine);

  // Serialize translation files
  const serializedFiles: { path: string; content: string }[] = files.map((f) => ({
    path: f.path,
    content: serializeEntries(f.entries, f.raw, f.format),
  }));

  // Include lock file if provided
  if (lockFile) {
    serializedFiles.push({ path: lockFile.path, content: lockFile.content });
  }

  try {
    const pr = await createPR(installationId, {
      owner,
      repo,
      baseBranch,
      newBranch,
      files: serializedFiles,
      title,
      body: prBody,
    });
    return NextResponse.json({ pr });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create PR";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
