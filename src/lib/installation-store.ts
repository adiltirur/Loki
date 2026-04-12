/**
 * In-memory installation store: GitHub user ID → installation IDs.
 * Production: replace with database (Postgres, Prisma, etc.)
 */

const store = new Map<string, number[]>();

export function addInstallation(userId: string, installationId: number): void {
  const existing = store.get(userId) ?? [];
  if (!existing.includes(installationId)) {
    store.set(userId, [...existing, installationId]);
  }
}

export function getInstallations(userId: string): number[] {
  return store.get(userId) ?? [];
}

export function removeInstallation(userId: string, installationId: number): void {
  const existing = store.get(userId) ?? [];
  store.set(userId, existing.filter((id) => id !== installationId));
}
