"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LockEntry, LockStatus } from "@/lib/loki-lock";

interface ReviewActionsProps {
  locale: string;
  keyName: string;
  lockEntry: LockEntry;
  username: string;
  onApprove: (locale: string, key: string, username: string, note?: string) => void;
  onReject: (locale: string, key: string, username: string, note?: string) => void;
}

const STATUS_VARIANT: Record<LockStatus, "success" | "warning" | "destructive" | "default"> = {
  approved: "success",
  pending_review: "warning",
  rejected: "destructive",
  unreviewed: "default",
};

const STATUS_LABEL: Record<LockStatus, string> = {
  approved: "Approved",
  pending_review: "Pending",
  rejected: "Rejected",
  unreviewed: "Unreviewed",
};

export function ReviewActions({
  locale,
  keyName,
  lockEntry,
  username,
  onApprove,
  onReject,
}: ReviewActionsProps) {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [note, setNote] = useState("");

  const handleReject = () => {
    if (showRejectInput) {
      onReject(locale, keyName, username, note || undefined);
      setShowRejectInput(false);
      setNote("");
    } else {
      setShowRejectInput(true);
    }
  };

  const handleApprove = () => {
    setShowRejectInput(false);
    setNote("");
    onApprove(locale, keyName, username);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <Badge variant={STATUS_VARIANT[lockEntry.status]} className="text-[10px]">
          {STATUS_LABEL[lockEntry.status]}
        </Badge>
        {lockEntry.updatedBy && (
          <span className="text-[10px] text-[var(--color-muted-foreground)]">
            by {lockEntry.updatedBy}
          </span>
        )}
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={handleApprove}
            title="Approve"
            className={cn(
              "flex items-center justify-center h-5 w-5 rounded transition-colors",
              lockEntry.status === "approved"
                ? "bg-[var(--color-success)] text-white"
                : "bg-[var(--color-surface-container-high)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-success)] hover:text-white"
            )}
          >
            <Check className="h-3 w-3" />
          </button>
          <button
            onClick={handleReject}
            title="Reject"
            className={cn(
              "flex items-center justify-center h-5 w-5 rounded transition-colors",
              lockEntry.status === "rejected"
                ? "bg-[var(--color-destructive)] text-white"
                : "bg-[var(--color-surface-container-high)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-destructive)] hover:text-white"
            )}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {lockEntry.note && !showRejectInput && (
        <p className="text-[10px] text-[var(--color-muted-foreground)] italic">
          &ldquo;{lockEntry.note}&rdquo;
        </p>
      )}

      {showRejectInput && (
        <div className="flex items-center gap-1">
          <input
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleReject();
              if (e.key === "Escape") { setShowRejectInput(false); setNote(""); }
            }}
            placeholder="Reason (optional)"
            className="flex-1 text-[10px] bg-[var(--color-surface-container-lowest)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] px-2 py-1 rounded outline-none"
          />
          <button
            onClick={handleReject}
            className="text-[10px] text-[var(--color-destructive)] hover:opacity-80"
          >
            Reject
          </button>
          <button
            onClick={() => { setShowRejectInput(false); setNote(""); }}
            className="text-[10px] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

interface BulkActionsBarProps {
  selectedCount: number;
  locales: string[];
  username: string;
  onApproveAll: () => void;
  onRejectAll: () => void;
  onClearSelection: () => void;
}

export function BulkActionsBar({
  selectedCount,
  onApproveAll,
  onRejectAll,
  onClearSelection,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-[var(--color-surface-container-high)] border-t border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)] shrink-0">
      <span className="text-xs text-[var(--color-foreground)]">
        {selectedCount} key{selectedCount !== 1 ? "s" : ""} selected
      </span>
      <button
        onClick={onApproveAll}
        className="flex items-center gap-1 text-xs text-[var(--color-success)] hover:opacity-80 transition-opacity"
      >
        <Check className="h-3 w-3" />
        Approve all
      </button>
      <button
        onClick={onRejectAll}
        className="flex items-center gap-1 text-xs text-[var(--color-destructive)] hover:opacity-80 transition-opacity"
      >
        <X className="h-3 w-3" />
        Reject all
      </button>
      <button
        onClick={onClearSelection}
        className="ml-auto text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      >
        Clear
      </button>
    </div>
  );
}
