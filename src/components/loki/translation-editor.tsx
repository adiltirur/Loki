"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { KeyListPanel } from "@/components/loki/key-list-panel";
import { MultiLocaleEditor } from "@/components/loki/multi-locale-editor";
import { BulkActionsBar } from "@/components/loki/review-actions";
import { PublishView } from "@/components/loki/publish-view";
import { useEditorState } from "@/lib/use-editor-state";
import { groupL10nFiles } from "@/lib/file-grouping";
import { useToast } from "@/lib/use-toast";
import type { L10nFileRef } from "@/lib/github";

interface TranslationEditorProps {
  owner?: string;
  repo?: string;
  branch?: string;
  installationId?: number;
}

export function TranslationEditor({
  owner,
  repo,
  branch = "main",
  installationId,
}: TranslationEditorProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const username = (session?.user as { login?: string } | undefined)?.login ?? session?.user?.name ?? "user";

  const editor = useEditorState();
  const [scanning, setScanning] = useState(false);
  const [publishMode, setPublishMode] = useState(false);
  const [addingKey, setAddingKey] = useState(false);
  const [newKeyInput, setNewKeyInput] = useState("");

  // Scan the repo and build groups
  useEffect(() => {
    if (!owner || !repo || !installationId) return;
    setScanning(true);
    const params = new URLSearchParams({ branch });
    fetch(`/api/repos/${owner}/${repo}/scan?${params}`)
      .then((r) => r.json())
      .then((d: { files?: L10nFileRef[]; installationId?: number }) => {
        const files = d.files ?? [];
        const instId = d.installationId ?? installationId;
        const groups = groupL10nFiles(files);
        editor.setGroups(groups);
        // Auto-select first group
        if (groups.length > 0 && owner && repo) {
          editor.selectGroup(groups[0], owner, repo, branch, instId);
        }
      })
      .catch(console.error)
      .finally(() => setScanning(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner, repo, branch, installationId]);

  const handleAddKey = useCallback(() => {
    const key = newKeyInput.trim();
    if (!key) return;
    editor.addKey(key);
    setNewKeyInput("");
    setAddingKey(false);
  }, [newKeyInput, editor]);

  const handleTranslate = useCallback(
    (_locale: string, _key: string) => {
      toast("AI translation coming soon", "info");
    },
    [toast]
  );

  const handlePublished = useCallback(() => {
    editor.clearEdits();
    setPublishMode(false);
  }, [editor]);

  // Handle group selection from panel
  const handleSelectGroup = useCallback(
    (group: typeof editor.groups[0]) => {
      if (!owner || !repo || !installationId) return;
      editor.selectGroup(group, owner, repo, branch, installationId);
    },
    [owner, repo, branch, installationId, editor]
  );

  const nonPrimaryLocales = editor.activeGroup
    ? editor.activeGroup.files
        .filter((f) => f.locale !== editor.activeGroup!.primaryLocale)
        .map((f) => f.locale)
    : [];

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

  // Publish overlay
  if (publishMode && editor.activeGroup) {
    const canWrite = true; // TODO: derive from repo permissions
    return (
      <PublishView
        owner={owner}
        repo={repo}
        baseBranch={branch}
        installationId={editor.installationId ?? installationId ?? 0}
        files={editor.getPublishPayload()}
        edits={editor.edits}
        lockPayload={editor.getLockPayload()}
        lockData={editor.lockData}
        primaryKeys={editor.primaryKeys}
        locales={nonPrimaryLocales}
        totalChanges={editor.totalChangeCount}
        readOnly={!canWrite}
        onBack={() => setPublishMode(false)}
        onPublished={handlePublished}
      />
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden min-h-0 -m-6">
      {/* Left — key list panel */}
      <div className="w-56 shrink-0 bg-[var(--color-surface-container-low)] flex flex-col overflow-hidden border-r border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)]">
        {scanning || editor.loadingGroup ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-[var(--color-muted-foreground)]" />
          </div>
        ) : (
          <KeyListPanel
            groups={editor.groups}
            activeGroup={editor.activeGroup}
            onSelectGroup={handleSelectGroup}
            filteredKeys={editor.filteredKeys}
            primaryKeys={editor.primaryKeys}
            selectedKey={editor.selectedKey}
            selectedKeys={editor.selectedKeys}
            searchQuery={editor.searchQuery}
            statusFilter={editor.statusFilter}
            lockData={editor.lockData}
            onSelectKey={editor.selectKey}
            onToggleKeySelection={editor.toggleKeySelection}
            onSearchChange={editor.setSearchQuery}
            onStatusFilterChange={editor.setStatusFilter}
            onSelectAll={editor.selectAllVisible}
            onClearSelection={editor.clearKeySelection}
            onAddKey={() => setAddingKey(true)}
            isKeyEdited={editor.isKeyEdited}
            isKeyMissing={editor.isKeyMissing}
            getStatusCounts={editor.getStatusCounts}
            owner={owner}
            repo={repo}
          />
        )}
      </div>

      {/* Center — editor */}
      <div className="flex flex-1 flex-col overflow-hidden bg-[var(--color-background)]">
        {!editor.activeGroup ? (
          <div className="flex flex-1 items-center justify-center text-sm text-[var(--color-muted-foreground)]">
            No localization files found
          </div>
        ) : !editor.selectedKey ? (
          <div className="flex flex-1 items-center justify-center text-sm text-[var(--color-muted-foreground)]">
            Select a key to start translating
          </div>
        ) : (
          <MultiLocaleEditor
            selectedKey={editor.selectedKey}
            activeGroup={editor.activeGroup}
            lockData={editor.lockData}
            username={username}
            getEffectiveValue={editor.getEffectiveValue}
            getOriginalValue={editor.getOriginalValue}
            isKeyMissing={editor.isKeyMissing}
            onUpdateValue={(locale, key, value) =>
              editor.updateValue(locale, key, value, username)
            }
            onDeleteKey={editor.deleteKey}
            onApprove={editor.approveKey}
            onReject={editor.rejectKey}
            onTranslate={handleTranslate}
          />
        )}

        {/* Add key input */}
        {addingKey && (
          <div className="shrink-0 border-t border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)] px-4 py-2.5 bg-[var(--color-background)] flex items-center gap-2">
            <Plus className="h-3 w-3 text-[var(--color-muted-foreground)]" />
            <input
              autoFocus
              value={newKeyInput}
              onChange={(e) => setNewKeyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddKey();
                if (e.key === "Escape") { setAddingKey(false); setNewKeyInput(""); }
              }}
              placeholder="new.key.name"
              className="font-mono text-xs bg-transparent text-[var(--color-foreground)] outline-none flex-1"
            />
            <button
              onClick={handleAddKey}
              className="text-xs text-[var(--color-primary)] hover:opacity-80"
            >
              Add
            </button>
            <button
              onClick={() => { setAddingKey(false); setNewKeyInput(""); }}
              className="text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Publish bottom bar */}
        <div className="shrink-0 border-t border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)] px-4 py-2 bg-[var(--color-background)] flex items-center justify-between">
          <span className="text-xs text-[var(--color-muted-foreground)]">
            {editor.totalChangeCount > 0
              ? `${editor.totalChangeCount} change${editor.totalChangeCount !== 1 ? "s" : ""} pending`
              : "No changes"}
          </span>
          <button
            onClick={() => setPublishMode(true)}
            disabled={editor.totalChangeCount === 0}
            className="flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium bg-[var(--color-primary)] text-[var(--color-primary-foreground)] disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            Publish
            {editor.totalChangeCount > 0 && (
              <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] tabular-nums">
                {editor.totalChangeCount}
              </span>
            )}
          </button>
        </div>

        {/* Bulk actions bar */}
        {editor.selectedKeys.size > 0 && (
          <BulkActionsBar
            selectedCount={editor.selectedKeys.size}
            locales={nonPrimaryLocales}
            username={username}
            onApproveAll={() =>
              editor.bulkApprove([...editor.selectedKeys], nonPrimaryLocales, username)
            }
            onRejectAll={() =>
              editor.bulkReject([...editor.selectedKeys], nonPrimaryLocales, username)
            }
            onClearSelection={editor.clearKeySelection}
          />
        )}
      </div>
    </div>
  );
}
