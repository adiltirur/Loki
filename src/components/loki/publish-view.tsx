"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, ArrowLeft, Check, ChevronDown, ChevronRight, ExternalLink, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { lokiBranchName } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { FilePayload } from "@/lib/use-editor-state";
import type { LokiLockData } from "@/lib/loki-lock";
import { getStatusCounts } from "@/lib/loki-lock";

interface PublishViewProps {
  owner: string;
  repo: string;
  baseBranch: string;
  installationId: number;
  files: FilePayload[];
  /** The edits map (locale → key → newValue) used to show only changed entries in the diff */
  edits: Map<string, Map<string, string>>;
  lockPayload: { path: string; content: string } | null;
  lockData: LokiLockData;
  primaryKeys: string[];
  locales: string[];
  totalChanges: number;
  readOnly?: boolean;
  onBack: () => void;
  onPublished: () => void;
}

export function PublishView({
  owner,
  repo,
  baseBranch,
  installationId,
  files,
  edits,
  lockPayload,
  lockData,
  primaryKeys,
  locales,
  totalChanges,
  readOnly = false,
  onBack,
  onPublished,
}: PublishViewProps) {
  const branchName = lokiBranchName();
  const defaultTitle = `Translation update — ${totalChanges} key${totalChanges !== 1 ? "s" : ""} changed`;

  const [ticketUrl, setTicketUrl] = useState("");
  const [prTitle, setPrTitle] = useState(defaultTitle);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set(files.map((f) => f.path)));
  const [acknowledgeRejected, setAcknowledgeRejected] = useState(false);

  const nonPrimaryLocales = locales;
  const statusCounts = getStatusCounts(lockData, primaryKeys, nonPrimaryLocales);

  // Reset acknowledgement whenever the rejected count changes so the user
  // must re-confirm if they go back and change review statuses.
  useEffect(() => {
    setAcknowledgeRejected(false);
  }, [statusCounts.rejected]);

  /**
   * Build the set of keys that actually changed in a given file path.
   * A key is "changed" if it appears in any locale's edits map, or if the
   * file itself appears in the payload (added/deleted keys).
   */
  const getChangedEntriesForFile = (file: FilePayload): typeof file.entries => {
    const localeEdits = edits.get(file.locale);
    if (!localeEdits) return [];
    return file.entries.filter((e) => localeEdits.has(e.key));
  };

  const handlePublish = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/repos/${owner}/${repo}/pr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          installationId,
          baseBranch,
          ticketUrl: ticketUrl || undefined,
          prTitle,
          // Full entries are intentional — translation files must be written as
          // complete files (not partial diffs). The diff UI above uses
          // getChangedEntriesForFile to display only changed keys.
          files: files.map((f) => ({
            path: f.path,
            entries: f.entries,
            raw: f.raw,
            format: f.format,
          })),
          lockFile: lockPayload ?? undefined,
          statusCounts,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create PR");
      setPrUrl(data.pr.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    files.forEach((file) => {
      const content = JSON.stringify(
        Object.fromEntries(file.entries.map((e) => [e.key, e.value])),
        null,
        2
      );
      const blob = new Blob([content], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.path.split("/").pop() ?? "translations.json";
      a.click();
      // Defer revocation so the browser has time to start the download
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  };

  // Success state — only call onPublished; parent is responsible for navigation
  if (prUrl) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-background)]">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-success-container)]">
            <Check className="h-7 w-7 text-[var(--color-success)]" />
          </div>
          <div>
            <p className="font-medium text-sm mb-1">PR created successfully</p>
            <a
              href={prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 text-sm text-[var(--color-primary)] hover:underline"
            >
              View PR on GitHub
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <Button variant="ghost" size="sm" onClick={onPublished}>
            Continue editing
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--color-background)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)] shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to editor
        </button>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-[var(--color-muted-foreground)]">
            {totalChanges} change{totalChanges !== 1 ? "s" : ""} in {files.length} file{files.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left — diff */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
          <h2 className="text-base font-semibold">Review changes before publishing</h2>

          {files.map((file) => {
            const expanded = expandedFiles.has(file.path);
            const changedEntries = getChangedEntriesForFile(file);
            return (
              <div
                key={file.path}
                className="rounded border border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)] overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedFiles((prev) => {
                      const next = new Set(prev);
                      if (next.has(file.path)) next.delete(file.path);
                      else next.add(file.path);
                      return next;
                    })
                  }
                  className="flex w-full items-center gap-2 px-4 py-3 bg-[var(--color-surface-container-lowest)] hover:bg-[var(--color-surface-container)] transition-colors"
                >
                  {expanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-[var(--color-muted-foreground)]" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-[var(--color-muted-foreground)]" />
                  )}
                  <span className="font-mono text-sm flex-1 text-left">{file.path}</span>
                  <Badge variant="success" className="text-[10px]">
                    +{changedEntries.length}
                  </Badge>
                </button>
                {expanded && (
                  <div className="divide-y divide-[color-mix(in_srgb,var(--color-outline-variant)_8%,transparent)]">
                    {changedEntries.length === 0 ? (
                      <p className="px-4 py-3 text-xs text-[var(--color-muted-foreground)]">
                        No changed keys in this file
                      </p>
                    ) : (
                      changedEntries.map((entry) => (
                        <div key={entry.key} className="px-4 py-2.5">
                          <p className="font-mono text-[10px] text-[var(--color-muted-foreground)] mb-1">
                            {entry.key}
                          </p>
                          <p className="font-mono text-xs text-[var(--color-success)]">
                            + &quot;{entry.value}&quot;
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right — form */}
        <div className="w-80 shrink-0 border-l border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)] overflow-y-auto no-scrollbar p-6 space-y-5">
          {/* Approval stats */}
          <div>
            <p className="label-caps text-[var(--color-muted-foreground)] mb-2">Approval Stats</p>
            <div className="space-y-1">
              <StatRow label="Approved" value={statusCounts.approved} color="text-[var(--color-success)]" />
              <StatRow label="Pending" value={statusCounts.pending_review} color="text-[var(--color-warning)]" />
              <StatRow label="Rejected" value={statusCounts.rejected} color="text-[var(--color-destructive)]" />
              <StatRow label="Unreviewed" value={statusCounts.unreviewed} color="text-[var(--color-muted-foreground)]" />
            </div>
          </div>

          {/* Rejected warning */}
          {statusCounts.rejected > 0 && (
            <div className="rounded bg-[var(--color-warning-container)] text-[var(--color-warning)] px-3 py-2 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  {statusCounts.rejected} rejected key{statusCounts.rejected !== 1 ? "s" : ""} will be included in this PR.
                </span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acknowledgeRejected}
                  onChange={(e) => setAcknowledgeRejected(e.target.checked)}
                  className="h-3 w-3 rounded accent-[var(--color-warning)]"
                />
                <span>I understand and want to proceed</span>
              </label>
            </div>
          )}

          {/* PR title */}
          {!readOnly && (
            <div>
              <label className="label-caps text-[var(--color-muted-foreground)] block mb-1.5">
                PR Title
              </label>
              <input
                value={prTitle}
                onChange={(e) => setPrTitle(e.target.value)}
                className="w-full text-xs bg-[var(--color-surface-container-lowest)] text-[var(--color-foreground)] px-3 py-2 rounded outline-none focus:border-l-2 focus:border-l-[var(--color-primary)] focus:pl-[10px] transition-all"
              />
            </div>
          )}

          {/* Ticket link */}
          {!readOnly && (
            <div>
              <label className="label-caps text-[var(--color-muted-foreground)] block mb-1.5">
                <span className="flex items-center gap-1">
                  <Link className="h-3 w-3" />
                  Link a ticket (optional)
                </span>
              </label>
              <Input
                mono
                placeholder="https://jira.../TICKET-123 or #42"
                value={ticketUrl}
                onChange={(e) => setTicketUrl(e.target.value)}
              />
            </div>
          )}

          {/* Branch name */}
          {!readOnly && (
            <div>
              <p className="label-caps text-[var(--color-muted-foreground)] mb-1">Branch</p>
              <p className="font-mono text-xs text-[var(--color-success)]">{branchName}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs text-[var(--color-destructive)]">{error}</p>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-2">
            {readOnly ? (
              <Button onClick={handleDownload} className="w-full">
                Download files
              </Button>
            ) : (
              <Button
                onClick={handlePublish}
                disabled={loading || files.length === 0 || (statusCounts.rejected > 0 && !acknowledgeRejected)}
                className="w-full"
              >
                {loading ? "Creating PR..." : "Create PR"}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onBack} className="w-full">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-[var(--color-muted-foreground)]">{label}</span>
      <span className={cn("font-medium tabular-nums", color)}>{value}</span>
    </div>
  );
}
