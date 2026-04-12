export type LockStatus = "unreviewed" | "pending_review" | "approved" | "rejected";

export interface LockEntry {
  status: LockStatus;
  updatedBy?: string;
  updatedAt?: string;
  note?: string;
}

export interface LokiLockData {
  version: 1;
  keys: Record<string, Record<string, LockEntry>>;  // key → locale → entry
}

export function createEmptyLock(): LokiLockData {
  return { version: 1, keys: {} };
}

export function parseLockFile(content: string): LokiLockData {
  try {
    const parsed = JSON.parse(content) as LokiLockData;
    if (parsed.version !== 1 || typeof parsed.keys !== "object") {
      return createEmptyLock();
    }
    return parsed;
  } catch {
    return createEmptyLock();
  }
}

export function serializeLockFile(data: LokiLockData): string {
  // Sort keys for stable output and easier diffing
  const sortedKeys: LokiLockData["keys"] = {};
  for (const key of Object.keys(data.keys).sort()) {
    const localeEntries: Record<string, LockEntry> = {};
    for (const locale of Object.keys(data.keys[key]).sort()) {
      localeEntries[locale] = data.keys[key][locale];
    }
    sortedKeys[key] = localeEntries;
  }
  return JSON.stringify({ version: 1, keys: sortedKeys }, null, 2) + "\n";
}

export function setKeyStatus(
  lock: LokiLockData,
  key: string,
  locale: string,
  status: LockStatus,
  updatedBy: string,
  note?: string
): LokiLockData {
  const entry: LockEntry = {
    status,
    updatedBy,
    updatedAt: new Date().toISOString(),
    ...(note ? { note } : {}),
  };
  return {
    ...lock,
    keys: {
      ...lock.keys,
      [key]: {
        ...(lock.keys[key] ?? {}),
        [locale]: entry,
      },
    },
  };
}

export function getKeyEntry(
  lock: LokiLockData,
  key: string,
  locale: string
): LockEntry {
  return lock.keys[key]?.[locale] ?? { status: "unreviewed" };
}

export function getStatusCounts(
  lock: LokiLockData,
  keys: string[],
  locales: string[]
): Record<LockStatus, number> {
  const counts: Record<LockStatus, number> = {
    unreviewed: 0,
    pending_review: 0,
    approved: 0,
    rejected: 0,
  };
  for (const key of keys) {
    for (const locale of locales) {
      const status = getKeyEntry(lock, key, locale).status;
      counts[status]++;
    }
  }
  return counts;
}

/**
 * Returns the most prominent status for a key across all non-primary locales.
 * Priority: rejected > pending_review > unreviewed > approved
 */
export function getKeyOverallStatus(
  lock: LokiLockData,
  key: string,
  locales: string[]
): LockStatus {
  const statuses = locales.map((l) => getKeyEntry(lock, key, l).status);
  if (statuses.includes("rejected")) return "rejected";
  if (statuses.includes("pending_review")) return "pending_review";
  if (statuses.includes("unreviewed")) return "unreviewed";
  return "approved";
}
