import { db } from "@/lib/db";

export async function addInstallation(userId: string, installationId: number): Promise<void> {
  await db.installation.upsert({
    where: { userId_installationId: { userId, installationId } },
    update: {},
    create: { userId, installationId },
  });
}

export async function getInstallations(userId: string): Promise<number[]> {
  const rows = await db.installation.findMany({
    where: { userId },
    select: { installationId: true },
  });
  return rows.map((r) => r.installationId);
}

export async function removeInstallation(userId: string, installationId: number): Promise<void> {
  await db.installation.deleteMany({
    where: { userId, installationId },
  });
}
