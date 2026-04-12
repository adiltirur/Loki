"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Plus, Trash2, Link } from "lucide-react";
import { KeyList } from "@/components/loki/key-list";
import { AISuggestionCard } from "@/components/loki/ai-suggestion-card";
import { Button } from "@/components/ui/button";
import { PublishModal } from "@/components/loki/publish-modal";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { L10nEntry, L10nFileRef } from "@/lib/github";

// ─── Types ────────────────────────────────────────────────────────────────────

type EditableEntry = L10nEntry & {
  status: "original" | "edited" | "added" | "deleted";
  originalValue?: string;
};

interface LoadedFile {
  ref: L10nFileRef;
  entries: EditableEntry[];
  raw: Record<string, unknown>;
  installationId: number;
}

interface TranslationEditorProps {
  owner?: string;
  repo?: string;
  branch?: string;
  installationId?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TranslationEditor({
  owner,
  repo,
  branch = "main",
  installationId,
}: TranslationEditorProps) {
  const t = useTranslations("app.editor");
  const [files, setFiles] = useState<L10nFileRef[]>([]);
  const [selectedFile, setSelectedFile] = useState<LoadedFile | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [newKeyInput, setNewKeyInput] = useState("");
  const [addingKey, setAddingKey] = useState(false);

  // Scan the repo for l10n files on mount
  useEffect(() => {
    if (!owner || !repo) return;
    setScanning(true);
    const params = new URLSearchParams({ branch });
    fetch(`/api/repos/${owner}/${repo}/scan?${params}`)
      .then((r) => r.json())
      .then((d: { files?: L10nFileRef[] }) => setFiles(d.files ?? []))
      .catch(console.error)
      .finally(() => setScanning(false));
  }, [owner, repo, branch]);

  // Load a file's content when selected
  const loadFile = useCallback(
    async (fileRef: L10nFileRef) => {
      if (!owner || !repo) return;
      setLoadingFile(true);
      setSelectedKey(null);
      try {
        const params = new URLSearchParams({
          path: fileRef.path,
          branch,
          ...(installationId ? { installationId: String(installationId) } : {}),
        });
        const r = await fetch(`/api/repos/${owner}/${repo}/files?${params}`);
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);

        setSelectedFile({
          ref: fileRef,
          entries: (data.entries as L10nEntry[]).map((e) => ({
            ...e,
            status: "original" as const,
          })),
          raw: data.raw,
          installationId: data.installationId,
        });
      } catch (err) {
        console.error("Failed to load file:", err);
      } finally {
        setLoadingFile(false);
      }
    },
    [owner, repo, branch, installationId]
  );

  // Update a single entry's value
  const updateEntry = (key: string, value: string) => {
    setSelectedFile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        entries: prev.entries.map((e) =>
          e.key === key
            ? {
                ...e,
                value,
                status: e.status === "added" ? "added" : "edited",
                originalValue: e.originalValue ?? e.value,
              }
            : e
        ),
      };
    });
  };

  // Delete a key (mark as deleted)
  const deleteEntry = (key: string) => {
    setSelectedFile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        entries: prev.entries.map((e) =>
          e.key === key
            ? { ...e, status: e.status === "added" ? "deleted" : "deleted" }
            : e
        ),
      };
    });
    if (selectedKey === key) setSelectedKey(null);
  };

  // Add a new key
  const addKey = () => {
    const key = newKeyInput.trim();
    if (!key || !selectedFile) return;
    if (selectedFile.entries.some((e) => e.key === key)) return;
    setSelectedFile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        entries: [
          ...prev.entries,
          { key, value: "", status: "added", originalValue: undefined },
        ],
      };
    });
    setSelectedKey(key);
    setNewKeyInput("");
    setAddingKey(false);
  };

  const activeEntries = selectedFile?.entries.filter((e) => e.status !== "deleted") ?? [];
  const pendingCount = selectedFile?.entries.filter(
    (e) => e.status !== "original"
  ).length ?? 0;

  const selectedEntry = activeEntries.find((e) => e.key === selectedKey) ?? null;

  // No repo selected
  if (!owner || !repo) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center py-24">
        <p className="text-sm font-medium">No repository selected</p>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Go to Projects and open a repository to start editing translations.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden min-h-0 -m-6">
      {/* Left — file list */}
      <div className="w-52 shrink-0 bg-[var(--color-surface-container-low)] flex flex-col overflow-hidden">
        <div className="px-3 py-2 label-caps text-[var(--color-muted-foreground)] border-b border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)]">
          {owner}/{repo}
        </div>
        {scanning ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-[var(--color-muted-foreground)]" />
          </div>
        ) : files.length === 0 ? (
          <p className="p-3 text-xs text-[var(--color-muted-foreground)]">
            No localization files found
          </p>
        ) : (
          <KeyList
            files={files}
            entries={activeEntries}
            selectedKey={selectedKey}
            selectedFilePath={selectedFile?.ref.path}
            onSelectFile={loadFile}
            onSelectKey={setSelectedKey}
          />
        )}
      </div>

      {/* Center — editor */}
      <div className="flex flex-1 flex-col overflow-hidden bg-[var(--color-background)]">
        {loadingFile ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--color-muted-foreground)]" />
          </div>
        ) : !selectedFile ? (
          <div className="flex flex-1 items-center justify-center text-sm text-[var(--color-muted-foreground)]">
            Select a file to start editing
          </div>
        ) : !selectedEntry ? (
          <div className="flex flex-1 items-center justify-center text-sm text-[var(--color-muted-foreground)]">
            {t("noKeySelected")}
          </div>
        ) : (
          <EditorPanel
            entry={selectedEntry}
            onChange={updateEntry}
            onDelete={deleteEntry}
            t={t}
          />
        )}

        {/* Bottom bar */}
        {selectedFile && (
          <div className="flex items-center justify-between border-t border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)] px-4 py-2.5 bg-[var(--color-background)] shrink-0">
            <div className="flex items-center gap-3">
              {addingKey ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={newKeyInput}
                    onChange={(e) => setNewKeyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addKey();
                      if (e.key === "Escape") setAddingKey(false);
                    }}
                    placeholder="new.key.name"
                    className="font-mono text-xs bg-[var(--color-surface-container-lowest)] text-[var(--color-foreground)] px-2 py-1 rounded outline-none w-48"
                  />
                  <Button size="sm" onClick={addKey} className="h-6 px-2 text-xs">Add</Button>
                  <button
                    onClick={() => setAddingKey(false)}
                    className="text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAddingKey(true)}
                  className="flex items-center gap-1 text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
                >
                  <Plus className="h-3 w-3" /> Add key
                </button>
              )}
              {pendingCount > 0 && (
                <span className="text-xs text-[var(--color-muted-foreground)]">
                  {t("pendingChanges", { count: pendingCount })}
                </span>
              )}
            </div>
            <Button
              onClick={() => setPublishOpen(true)}
              disabled={pendingCount === 0}
              size="sm"
            >
              {t("publish")}
            </Button>
          </div>
        )}
      </div>

      {/* Right — key metadata */}
      {selectedEntry && (
        <div className="w-56 shrink-0 border-l border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)] overflow-y-auto no-scrollbar p-4 space-y-4">
          <div>
            <p className="label-caps text-[var(--color-muted-foreground)] mb-2">Key Metadata</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--color-muted-foreground)]">Status</span>
                <Badge
                  variant={
                    selectedEntry.status === "original" ? "success"
                    : selectedEntry.status === "added" ? "ai"
                    : "warning"
                  }
                >
                  {selectedEntry.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted-foreground)]">File</span>
                <span className="font-mono truncate max-w-24 text-right">
                  {selectedFile?.ref.path.split("/").pop()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-muted-foreground)]">Format</span>
                <span>{selectedFile?.ref.format.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {selectedEntry.originalValue && (
            <div>
              <p className="label-caps text-[var(--color-muted-foreground)] mb-1">Original</p>
              <p className="font-mono text-xs text-[var(--color-muted-foreground)] leading-relaxed line-through opacity-70">
                {selectedEntry.originalValue}
              </p>
            </div>
          )}
        </div>
      )}

      <PublishModal
        open={publishOpen}
        onOpenChange={setPublishOpen}
        owner={owner}
        repo={repo}
        baseBranch={branch}
        installationId={selectedFile?.installationId}
        files={
          selectedFile
            ? [
                {
                  path: selectedFile.ref.path,
                  entries: selectedFile.entries.filter((e) => e.status !== "deleted").map(({ key, value }) => ({ key, value })),
                  raw: selectedFile.raw,
                  format: selectedFile.ref.format,
                },
              ]
            : []
        }
        changedKeys={pendingCount}
        changedFiles={1}
      />
    </div>
  );
}

// ─── Editor panel ─────────────────────────────────────────────────────────────

function EditorPanel({
  entry,
  onChange,
  onDelete,
  t,
}: {
  entry: EditableEntry;
  onChange: (key: string, value: string) => void;
  onDelete: (key: string) => void;
  t: ReturnType<typeof useTranslations<"app.editor">>;
}) {
  return (
    <div className="flex flex-1 flex-col p-4 gap-4 overflow-y-auto no-scrollbar">
      {/* Key name */}
      <div className="flex items-center justify-between">
        <div>
          <p className="label-caps text-[var(--color-muted-foreground)] mb-1">Key</p>
          <p className="font-mono text-sm text-[var(--color-primary)] opacity-70">
            {entry.key}
          </p>
        </div>
        <button
          onClick={() => onDelete(entry.key)}
          className="flex items-center gap-1 text-xs text-[var(--color-destructive)] opacity-60 hover:opacity-100 transition-opacity"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>

      {/* Source (original value) */}
      {entry.originalValue && (
        <div>
          <p className="label-caps text-[var(--color-muted-foreground)] mb-2">
            {t("sourceString")}
          </p>
          <div className="rounded bg-[var(--color-surface-container-lowest)] p-3 font-mono text-xs text-[var(--color-muted-foreground)] leading-relaxed">
            {entry.originalValue}
          </div>
        </div>
      )}

      {/* Translation input */}
      <div>
        <p className="label-caps text-[var(--color-muted-foreground)] mb-2">
          {t("targetString")}
        </p>
        <textarea
          value={entry.value}
          onChange={(e) => onChange(entry.key, e.target.value)}
          placeholder={entry.status === "added" ? "Enter translation..." : ""}
          rows={4}
          className={cn(
            "w-full rounded bg-[var(--color-surface-container-lowest)] p-3 font-mono text-xs text-[var(--color-foreground)]",
            "placeholder:text-[var(--color-muted-foreground)] outline-none resize-none",
            "focus:border-l-2 focus:border-l-[var(--color-primary)] focus:pl-[calc(0.75rem-2px)] transition-all"
          )}
        />
      </div>

      {/* AI suggestion stub (placeholder — wire to real AI later) */}
      {entry.status === "original" && entry.value && (
        <AISuggestionCard
          suggestion={`[AI] ${entry.value}`}
          confidence={85}
          onAccept={(val) => onChange(entry.key, val.replace("[AI] ", ""))}
        />
      )}
    </div>
  );
}
