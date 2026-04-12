"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ExternalLink, ChevronDown, ChevronRight, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { lokiBranchName } from "@/lib/utils";
import type { L10nEntry } from "@/lib/github";

interface FilePayload {
  path: string;
  entries: L10nEntry[];
  raw: Record<string, unknown>;
  format: "arb" | "json";
}

interface PublishModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owner: string;
  repo: string;
  baseBranch: string;
  installationId?: number;
  files: FilePayload[];
  changedKeys: number;
  changedFiles: number;
  readOnly?: boolean;
}

export function PublishModal({
  open,
  onOpenChange,
  owner,
  repo,
  baseBranch,
  installationId,
  files,
  changedKeys,
  changedFiles,
  readOnly = false,
}: PublishModalProps) {
  const t = useTranslations("app.publish");
  const [ticketUrl, setTicketUrl] = useState("");
  const [diffExpanded, setDiffExpanded] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prUrl, setPrUrl] = useState<string | null>(null);

  const branchName = lokiBranchName();

  const handlePublish = async () => {
    if (!installationId) return;
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
          files,
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
    // Build a zip-like download: one JSON file per changed file
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
      URL.revokeObjectURL(url);
    });
  };

  const handleClose = () => {
    if (prUrl) {
      setPrUrl(null);
      setTicketUrl("");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{t("title")}</DialogTitle>
            {!prUrl && <Badge variant="warning">Awaiting Review</Badge>}
          </div>
        </DialogHeader>

        {prUrl ? (
          /* ── Success state ── */
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-success-container)]">
              <Check className="h-6 w-6 text-[var(--color-success)]" />
            </div>
            <p className="text-sm">{t("success")}</p>
            <a
              href={prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-[var(--color-primary)] hover:underline"
            >
              {t("viewPR")}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ) : (
          <>
            {/* ── Summary ── */}
            <p className="text-xs text-[var(--color-muted-foreground)] mb-3">
              {t("summary", { count: changedKeys, files: changedFiles })}
            </p>

            {/* ── Diff preview ── */}
            {files.length > 0 && (
              <div className="rounded overflow-hidden bg-[var(--color-surface-container-lowest)] mb-3">
                <button
                  onClick={() => setDiffExpanded((e) => !e)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-container-high)] transition-colors"
                >
                  {diffExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  <span className="font-mono">
                    diff: {files[0].path.split("/").pop()}
                  </span>
                  <span className="ml-auto text-[var(--color-success)]">
                    +{files[0].entries.length}
                  </span>
                </button>
                {diffExpanded && (
                  <div className="px-3 pb-3 max-h-32 overflow-y-auto no-scrollbar">
                    {files[0].entries.slice(0, 8).map((entry) => (
                      <div
                        key={entry.key}
                        className="font-mono text-xs py-0.5 text-[var(--color-success)]"
                      >
                        + &quot;{entry.key}&quot;: &quot;{entry.value}&quot;
                      </div>
                    ))}
                    {files[0].entries.length > 8 && (
                      <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                        +{files[0].entries.length - 8} more keys...
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Ticket link ── */}
            {!readOnly && (
              <div className="mb-2">
                <label className="label-caps text-[var(--color-muted-foreground)] block mb-1.5">
                  {t("ticketLabel")}
                </label>
                <Input
                  mono
                  placeholder={t("ticketPlaceholder")}
                  value={ticketUrl}
                  onChange={(e) => setTicketUrl(e.target.value)}
                />
              </div>
            )}

            {/* ── Branch name ── */}
            {!readOnly && (
              <p className="text-xs text-[var(--color-success)] mb-4 font-mono">
                {t("branchName", { branch: branchName })}
              </p>
            )}

            {/* ── Error ── */}
            {error && (
              <p className="text-xs text-[var(--color-destructive)] mb-3">{error}</p>
            )}

            {/* ── Actions ── */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleClose}
                className="text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
              >
                {t("skipTicket")}
              </button>
              {readOnly ? (
                <Button onClick={handleDownload} className="gap-2">
                  <Download className="h-4 w-4" />
                  {t("downloadFiles")}
                </Button>
              ) : (
                <Button onClick={handlePublish} disabled={loading || !installationId}>
                  {loading ? "Creating PR..." : t("createPR")}
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
