"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { KeyListPanel } from "@/components/loki/key-list-panel";
import { MultiLocaleEditor } from "@/components/loki/multi-locale-editor";
import { BulkActionsBar } from "@/components/loki/review-actions";
import { PublishView } from "@/components/loki/publish-view";
import { KeyListSkeleton } from "@/components/loki/skeletons";
import { Button } from "@/components/ui/button";
import { useEditorState } from "@/lib/use-editor-state";
import { groupL10nFiles } from "@/lib/file-grouping";
import { useToast } from "@/lib/use-toast";
import { useTopbar, useTopbarConfig } from "@/components/loki/topbar-context";
import type { L10nFileRef } from "@/lib/github";

interface TranslationEditorProps {
  owner?: string;
  repo?: string;
  branch?: string;
  installationId?: number;
  subProjectRootPath?: string;
  subProjectName?: string;
}

export function TranslationEditor({
  owner,
  repo,
  branch = "main",
  installationId,
  subProjectRootPath,
  subProjectName,
}: TranslationEditorProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const t = useTranslations("app.editor");
  const tCommon = useTranslations("common");
  const username =
    (session?.user as { githubLogin?: string; login?: string } | undefined)?.githubLogin ??
    (session?.user as { login?: string } | undefined)?.login ??
    session?.user?.name ??
    "user";

  const editor = useEditorState();
  const [scanning, setScanning] = useState(false);
  const [publishMode, setPublishMode] = useState(false);
  const [addingKey, setAddingKey] = useState(false);
  const [newKeyInput, setNewKeyInput] = useState("");

  // Wire breadcrumbs + search input into the shared topbar.
  const breadcrumbs: string[] = [];
  if (owner && repo) breadcrumbs.push(`${owner}/${repo}`);
  if (owner && repo && branch) breadcrumbs.push(branch);
  if (subProjectName) breadcrumbs.push(subProjectName);
  useTopbarConfig({
    breadcrumbs,
    search: { enabled: Boolean(owner && repo), placeholder: tCommon("filterKeys") },
  });
  const { searchValue } = useTopbar();
  useEffect(() => {
    editor.setSearchQuery(searchValue);
    // editor.setSearchQuery is stable; depending on it triggers extra renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  // Scan the repo and build groups
  useEffect(() => {
    if (!owner || !repo || !installationId) return;
    setScanning(true);
    const params = new URLSearchParams({ branch });
    fetch(`/api/repos/${owner}/${repo}/scan?${params}`)
      .then((r) => r.json())
      .then((d: { files?: L10nFileRef[]; installationId?: number }) => {
        const allFiles = d.files ?? [];
        const files = subProjectRootPath
          ? allFiles.filter((f) =>
              subProjectRootPath === ""
                ? !f.path.includes("/")
                : f.path.startsWith(subProjectRootPath + "/") || f.path === subProjectRootPath
            )
          : allFiles;
        const instId = d.installationId ?? installationId;
        const groups = groupL10nFiles(files);
        editor.setGroups(groups);
        if (groups.length > 0 && owner && repo) {
          editor.selectGroup(groups[0], owner, repo, branch, instId);
        }
      })
      .catch(console.error)
      .finally(() => setScanning(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner, repo, branch, installationId, subProjectRootPath]);

  const handleAddKey = useCallback(() => {
    const key = newKeyInput.trim();
    if (!key) return;
    editor.addKey(key);
    setNewKeyInput("");
    setAddingKey(false);
  }, [newKeyInput, editor]);

  const handleTranslate = useCallback(
    (_locale: string, _key: string) => {
      toast(t("aiComingSoon"), "info");
    },
    [toast, t]
  );

  const handlePublished = useCallback(() => {
    editor.clearEdits();
    setPublishMode(false);
  }, [editor]);

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

  if (!owner || !repo) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center py-24">
        <p className="text-sm font-medium">{t("noRepoSelectedTitle")}</p>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          {t("noRepoSelectedDesc")}
        </p>
      </div>
    );
  }

  if (publishMode && editor.activeGroup) {
    const canWrite = true;
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
      <div className="w-56 shrink-0 bg-[var(--color-surface-container-low)] flex flex-col overflow-hidden border-r border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)]">
        {scanning || editor.loadingGroup ? (
          <div className="px-3 py-3">
            <KeyListSkeleton rows={10} />
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

      <div className="flex flex-1 flex-col overflow-hidden bg-[var(--color-background)]">
        <div className="flex flex-1 overflow-auto">
          {!editor.activeGroup ? (
            <div className="flex flex-1 items-center justify-center text-sm text-[var(--color-muted-foreground)]">
              {t("noLocalizationFiles")}
            </div>
          ) : !editor.selectedKey ? (
            <div className="flex flex-1 items-center justify-center text-sm text-[var(--color-muted-foreground)]">
              {t("noKeySelected")}
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
        </div>

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
              placeholder={t("newKeyPlaceholder")}
              className="font-mono text-xs bg-transparent text-[var(--color-foreground)] outline-none flex-1"
            />
            <button
              onClick={handleAddKey}
              className="text-xs text-[var(--color-primary)] hover:opacity-80"
            >
              {t("add")}
            </button>
            <button
              onClick={() => { setAddingKey(false); setNewKeyInput(""); }}
              className="text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            >
              {tCommon("cancel")}
            </button>
          </div>
        )}

        {/* Sticky publish bar — only when there are pending changes. */}
        {editor.totalChangeCount > 0 && (
          <div className="sticky bottom-0 left-0 right-0 z-10 flex items-center justify-between gap-3 px-6 py-3 bg-[var(--color-card)] border-t border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)] shadow-ambient">
            <span className="text-sm text-[var(--color-muted-foreground)]">
              {editor.totalChangeCount === 1
                ? t("keysChangedOne")
                : t("keysChangedOther", { count: editor.totalChangeCount })}
            </span>
            <Button size="sm" onClick={() => setPublishMode(true)}>
              {t("publishChanges")}
            </Button>
          </div>
        )}

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
