import { db } from "@/lib/db";

export interface AddInstallationOpts {
  userId: string;
  installationId: number;
  orgId?: string | null;
}

export async function addInstallation(opts: AddInstallationOpts): Promise<void> {
  const { userId, installationId, orgId } = opts;
  await db.installation.upsert({
    where: { userId_installationId: { userId, installationId } },
    update: orgId !== undefined ? { orgId } : {},
    create: { userId, installationId, orgId: orgId ?? null },
  });
}

export async function getInstallations(userId: string): Promise<number[]> {
  const rows = await db.installation.findMany({
    where: { userId },
    select: { installationId: true },
  });
  return rows.map((r) => r.installationId);
}

export async function getInstallationsForOrg(orgId: string): Promise<number[]> {
  const rows = await db.installation.findMany({
    where: { orgId },
    select: { installationId: true },
  });
  return rows.map((r) => r.installationId);
}

export async function installationBelongsToOrg(
  installationId: number,
  orgId: string
): Promise<boolean> {
  const row = await db.installation.findFirst({
    where: { installationId, orgId },
    select: { id: true },
  });
  return row !== null;
}

export async function removeInstallation(userId: string, installationId: number): Promise<void> {
  await db.installation.deleteMany({ where: { userId, installationId } });
}
