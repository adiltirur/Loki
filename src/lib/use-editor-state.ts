"use client";

import { useCallback, useState } from "react";
import type { L10nEntry, L10nFileRef } from "@/lib/github";
import type { L10nFileGroup } from "@/lib/file-grouping";
import {
  createEmptyLock,
  parseLockFile,
  serializeLockFile,
  setKeyStatus,
  getKeyEntry,
  getStatusCounts,
  getKeyOverallStatus,
  type LokiLockData,
  type LockStatus,
} from "@/lib/loki-lock";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LoadedLocaleFile {
  ref: L10nFileRef;
  entries: L10nEntry[];
  raw: Record<string, unknown>;
  sha: string;
  format: "arb" | "json";
}

export interface FilePayload {
  path: string;
  locale: string;
  entries: L10nEntry[];
  raw: Record<string, unknown>;
  format: "arb" | "json";
}

export interface UseEditorStateReturn {
  // Data
  groups: L10nFileGroup[];
  activeGroup: L10nFileGroup | null;
  loadedFiles: Map<string, LoadedLocaleFile>;
  edits: Map<string, Map<string, string>>;
  deletedKeys: Set<string>;
  addedKeys: Set<string>;
  selectedKey: string | null;
  searchQuery: string;
  statusFilter: LockStatus | "all";
  selectedKeys: Set<string>;   // for bulk actions
  lockData: LokiLockData;
  installationId: number | null;
  loadingGroup: boolean;

  // Computed
  primaryKeys: string[];
  filteredKeys: string[];
  totalChangeCount: number;
  changedFileCount: number;

  // Actions
  setGroups: (groups: L10nFileGroup[]) => void;
  selectGroup: (group: L10nFileGroup, owner: string, repo: string, branch: string, installationId: number) => void;
  selectKey: (key: string | null) => void;
  updateValue: (locale: string, key: string, value: string, username?: string) => void;
  deleteKey: (key: string) => void;
  addKey: (key: string) => void;
  setSearchQuery: (q: string) => void;
  setStatusFilter: (filter: LockStatus | "all") => void;
  toggleKeySelection: (key: string) => void;
  clearKeySelection: () => void;
  selectAllVisible: () => void;
  approveKey: (key: string, locale: string, username: string, note?: string) => void;
  rejectKey: (key: string, locale: string, username: string, note?: string) => void;
  bulkApprove: (keys: string[], locales: string[], username: string) => void;
  bulkReject: (keys: string[], locales: string[], username: string, note?: string) => void;
  getEffectiveValue: (locale: string, key: string) => string | undefined;
  getOriginalValue: (locale: string, key: string) => string | undefined;
  isKeyEdited: (key: string) => boolean;
  isKeyMissing: (locale: string, key: string) => boolean;
  getKeyLockStatus: (key: string) => LockStatus;
  getStatusCounts: () => ReturnType<typeof getStatusCounts>;
  getPublishPayload: () => FilePayload[];
  getLockPayload: () => { path: string; content: string } | null;
  clearEdits: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useEditorState(): UseEditorStateReturn {
  const [groups, setGroups] = useState<L10nFileGroup[]>([]);
  const [activeGroup, setActiveGroup] = useState<L10nFileGroup | null>(null);
  const [loadedFiles, setLoadedFiles] = useState<Map<string, LoadedLocaleFile>>(new Map());
  const [edits, setEdits] = useState<Map<string, Map<string, string>>>(new Map());
  const [deletedKeys, setDeletedKeys] = useState<Set<string>>(new Set());
  const [addedKeys, setAddedKeys] = useState<Set<string>>(new Set());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LockStatus | "all">("all");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [lockData, setLockData] = useState<LokiLockData>(createEmptyLock());
  const [installationId, setInstallationId] = useState<number | null>(null);
  const [loadingGroup, setLoadingGroup] = useState(false);

  // ── Computed ──────────────────────────────────────────────────────────────

  const primaryFile = activeGroup
    ? loadedFiles.get(activeGroup.primaryLocale) ?? null
    : null;

  const primaryKeys: string[] = (() => {
    const base = primaryFile?.entries.map((e) => e.key) ?? [];
    const added = [...addedKeys].filter((k) => !base.includes(k));
    return [...base.filter((k) => !deletedKeys.has(k)), ...added];
  })();

  const nonPrimaryLocales = activeGroup
    ? activeGroup.files.filter((f) => f.locale !== activeGroup.primaryLocale).map((f) => f.locale)
    : [];

  const filteredKeys: string[] = primaryKeys.filter((key) => {
    const matchesSearch =
      !searchQuery || key.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === "all") return true;
    const status = getKeyOverallStatus(lockData, key, nonPrimaryLocales);
    return status === statusFilter;
  });

  const totalChangeCount = (() => {
    let count = addedKeys.size + deletedKeys.size;
    for (const [, keyMap] of edits) {
      count += keyMap.size;
    }
    return count;
  })();

  const changedFileCount = (() => {
    if (!activeGroup) return 0;
    const changed = new Set<string>();
    if (addedKeys.size > 0 || deletedKeys.size > 0) {
      for (const f of activeGroup.files) changed.add(f.locale);
    }
    for (const [locale, keyMap] of edits) {
      if (keyMap.size > 0) changed.add(locale);
    }
    return changed.size;
  })();

  // ── Actions ───────────────────────────────────────────────────────────────

  const selectGroup = useCallback(
    async (
      group: L10nFileGroup,
      owner: string,
      repo: string,
      branch: string,
      instId: number
    ) => {
      setActiveGroup(group);
      setInstallationId(instId);
      setLoadedFiles(new Map());
      setEdits(new Map());
      setDeletedKeys(new Set());
      setAddedKeys(new Set());
      setSelectedKey(null);
      setSelectedKeys(new Set());
      setLockData(createEmptyLock());
      setLoadingGroup(true);

      try {
        // Load all locale files in parallel
        const results = await Promise.allSettled(
          group.files.map(async ({ locale, ref }) => {
            const params = new URLSearchParams({
              path: ref.path,
              branch,
              installationId: String(instId),
            });
            const r = await fetch(`/api/repos/${owner}/${repo}/files?${params}`);
            const data = await r.json();
            if (!r.ok) throw new Error(data.error ?? "Failed to load file");
            return {
              locale,
              file: {
                ref,
                entries: data.entries as L10nEntry[],
                raw: data.raw as Record<string, unknown>,
                sha: data.sha as string,
                format: ref.format,
              } satisfies LoadedLocaleFile,
            };
          })
        );

        const newLoadedFiles = new Map<string, LoadedLocaleFile>();
        for (const result of results) {
          if (result.status === "fulfilled") {
            newLoadedFiles.set(result.value.locale, result.value.file);
          }
        }
        setLoadedFiles(newLoadedFiles);

        // Also try to load loki.lock.json
        const lockPath = group.directory
          ? `${group.directory}/loki.lock.json`
          : "loki.lock.json";
        try {
          const lockParams = new URLSearchParams({
            path: lockPath,
            branch,
            installationId: String(instId),
          });
          const lockRes = await fetch(`/api/repos/${owner}/${repo}/files?${lockParams}`);
          if (lockRes.ok) {
            const lockFileData = await lockRes.json();
            // The files endpoint returns entries[], but we need the raw content
            // We'll parse it from the raw field which is the parsed JSON
            const rawContent = JSON.stringify(lockFileData.raw);
            setLockData(parseLockFile(rawContent));
          }
        } catch {
          // No lock file yet — start with empty
        }
      } finally {
        setLoadingGroup(false);
      }
    },
    []
  );

  const selectKey = useCallback((key: string | null) => {
    setSelectedKey(key);
  }, []);

  const updateValue = useCallback(
    (locale: string, key: string, value: string, username?: string) => {
      setEdits((prev) => {
        const next = new Map(prev);
        const localeMap = new Map(next.get(locale) ?? []);
        localeMap.set(key, value);
        next.set(locale, localeMap);
        return next;
      });
      // Auto-set lock status to pending_review when a value is changed
      if (username) {
        setLockData((prev) =>
          setKeyStatus(prev, key, locale, "pending_review", username)
        );
      }
    },
    []
  );

  const deleteKey = useCallback((key: string) => {
    setDeletedKeys((prev) => new Set([...prev, key]));
    setSelectedKey((prev) => (prev === key ? null : prev));
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    // Remove any pending edits for this key
    setEdits((prev) => {
      const next = new Map(prev);
      for (const [locale, keyMap] of next) {
        if (keyMap.has(key)) {
          const newKeyMap = new Map(keyMap);
          newKeyMap.delete(key);
          next.set(locale, newKeyMap);
        }
      }
      return next;
    });
  }, []);

  const addKey = useCallback((key: string) => {
    setAddedKeys((prev) => new Set([...prev, key]));
    setDeletedKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    setSelectedKey(key);
  }, []);

  const toggleKeySelection = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const clearKeySelection = useCallback(() => setSelectedKeys(new Set()), []);

  const selectAllVisible = useCallback(() => {
    setSelectedKeys(new Set(filteredKeys));
  }, [filteredKeys]);

  const approveKey = useCallback(
    (key: string, locale: string, username: string, note?: string) => {
      setLockData((prev) => setKeyStatus(prev, key, locale, "approved", username, note));
    },
    []
  );

  const rejectKey = useCallback(
    (key: string, locale: string, username: string, note?: string) => {
      setLockData((prev) => setKeyStatus(prev, key, locale, "rejected", username, note));
    },
    []
  );

  const bulkApprove = useCallback(
    (keys: string[], locales: string[], username: string) => {
      setLockData((prev) => {
        let next = { ...prev, keys: { ...prev.keys } };
        for (const key of keys) {
          for (const locale of locales) {
            next = setKeyStatus(next, key, locale, "approved", username);
          }
        }
        return next;
      });
    },
    []
  );

  const bulkReject = useCallback(
    (keys: string[], locales: string[], username: string, note?: string) => {
      setLockData((prev) => {
        let next = { ...prev, keys: { ...prev.keys } };
        for (const key of keys) {
          for (const locale of locales) {
            next = setKeyStatus(next, key, locale, "rejected", username, note);
          }
        }
        return next;
      });
    },
    []
  );

  // ── Getters ───────────────────────────────────────────────────────────────

  const getEffectiveValue = useCallback(
    (locale: string, key: string) => {
      return edits.get(locale)?.get(key) ?? loadedFiles.get(locale)?.entries.find((e) => e.key === key)?.value;
    },
    [edits, loadedFiles]
  );

  const getOriginalValue = useCallback(
    (locale: string, key: string) => {
      return loadedFiles.get(locale)?.entries.find((e) => e.key === key)?.value;
    },
    [loadedFiles]
  );

  const isKeyEdited = useCallback(
    (key: string) => {
      for (const [, keyMap] of edits) {
        if (keyMap.has(key)) return true;
      }
      return addedKeys.has(key);
    },
    [edits, addedKeys]
  );

  const isKeyMissing = useCallback(
    (locale: string, key: string) => {
      if (!loadedFiles.has(locale)) return false;
      const file = loadedFiles.get(locale)!;
      return !file.entries.some((e) => e.key === key);
    },
    [loadedFiles]
  );

  const getKeyLockStatus = useCallback(
    (key: string) => {
      return getKeyOverallStatus(lockData, key, nonPrimaryLocales);
    },
    [lockData, nonPrimaryLocales]
  );

  const getStatusCountsCb = useCallback(() => {
    return getStatusCounts(lockData, primaryKeys, nonPrimaryLocales);
  }, [lockData, primaryKeys, nonPrimaryLocales]);

  const getPublishPayload = useCallback((): FilePayload[] => {
    if (!activeGroup) return [];
    const payloads: FilePayload[] = [];

    for (const { locale, ref } of activeGroup.files) {
      const loaded = loadedFiles.get(locale);
      if (!loaded) continue;

      const localeEdits = edits.get(locale);
      const hasEdits = (localeEdits && localeEdits.size > 0) || addedKeys.size > 0 || deletedKeys.size > 0;
      if (!hasEdits) continue;

      const entries: L10nEntry[] = [];
      // Start from loaded entries
      for (const entry of loaded.entries) {
        if (deletedKeys.has(entry.key)) continue;
        entries.push({
          key: entry.key,
          value: localeEdits?.get(entry.key) ?? entry.value,
        });
      }
      // Add new keys
      for (const key of addedKeys) {
        if (!loaded.entries.some((e) => e.key === key)) {
          entries.push({ key, value: localeEdits?.get(key) ?? "" });
        }
      }

      payloads.push({ path: ref.path, locale, entries, raw: loaded.raw, format: ref.format });
    }

    return payloads;
  }, [activeGroup, loadedFiles, edits, addedKeys, deletedKeys]);

  const getLockPayload = useCallback((): { path: string; content: string } | null => {
    if (!activeGroup) return null;
    const lockPath = activeGroup.directory
      ? `${activeGroup.directory}/loki.lock.json`
      : "loki.lock.json";
    return { path: lockPath, content: serializeLockFile(lockData) };
  }, [activeGroup, lockData]);

  const clearEdits = useCallback(() => {
    setEdits(new Map());
    setDeletedKeys(new Set());
    setAddedKeys(new Set());
    setSelectedKey(null);
    setSelectedKeys(new Set());
  }, []);

  return {
    groups,
    activeGroup,
    loadedFiles,
    edits,
    deletedKeys,
    addedKeys,
    selectedKey,
    searchQuery,
    statusFilter,
    selectedKeys,
    lockData,
    installationId,
    loadingGroup,
    primaryKeys,
    filteredKeys,
    totalChangeCount,
    changedFileCount,
    setGroups,
    selectGroup,
    selectKey,
    updateValue,
    deleteKey,
    addKey,
    setSearchQuery,
    setStatusFilter,
    toggleKeySelection,
    clearKeySelection,
    selectAllVisible,
    approveKey,
    rejectKey,
    bulkApprove,
    bulkReject,
    getEffectiveValue,
    getOriginalValue,
    isKeyEdited,
    isKeyMissing,
    getKeyLockStatus,
    getStatusCounts: getStatusCountsCb,
    getPublishPayload,
    getLockPayload,
    clearEdits,
  };
}
