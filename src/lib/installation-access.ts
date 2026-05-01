import { auth } from "@/auth";
import {
  getInstallations,
  getInstallationsForOrg,
} from "@/lib/installation-store";

export interface InstallationAccessResult {
  ok: boolean;
  /** Installation IDs the caller may legitimately use (intersected with the requested id, if any). */
  installationIds: number[];
  /** Active org id (if any) — needed by callers that write SubProject etc. */
  orgId: string | null;
  status?: number;
  error?: string;
}

/**
 * Resolves the set of GitHub App installations available to the current
 * caller within their active org. If `requestedInstallationId` is given,
 * narrows to that single id and rejects with 403 when it isn't permitted.
 *
 * Super admins outside any active org fall back to their personal
 * installation list (matches pre-org behavior).
 */
export async function resolveInstallationAccess(
  requestedInstallationId?: number | null
): Promise<InstallationAccessResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, installationIds: [], orgId: null, status: 401, error: "Unauthorized" };
  }

  const orgId = session.activeOrgId ?? null;
  const allowed = orgId
    ? await getInstallationsForOrg(orgId)
    : session.user.role === "super_admin"
      ? await getInstallations(session.user.id)
      : [];

  if (allowed.length === 0) {
    return {
      ok: false,
      installationIds: [],
      orgId,
      status: 403,
      error: "No GitHub App installation for this organization",
    };
  }

  if (requestedInstallationId != null) {
    if (!allowed.includes(requestedInstallationId)) {
      return { ok: false, installationIds: [], orgId, status: 403, error: "Forbidden" };
    }
    return { ok: true, installationIds: [requestedInstallationId], orgId };
  }

  return { ok: true, installationIds: allowed, orgId };
}
