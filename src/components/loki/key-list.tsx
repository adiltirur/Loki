"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, FileJson, Sparkles, AlertCircle, Check, Edit, PlusCircle } from "lucide-react";
import type { L10nFileRef, L10nEntry } from "@/lib/github";
import { cn } from "@/lib/utils";

interface KeyListProps {
  files: L10nFileRef[];
  entries: (L10nEntry & { status: "original" | "edited" | "added" | "deleted" })[];
  selectedKey: string | null;
  selectedFilePath?: string;
  onSelectFile: (file: L10nFileRef) => void;
  onSelectKey: (key: string) => void;
}

const statusIcon = {
  original: <Check className="h-3 w-3 text-[var(--color-success)]" />,
  edited: <Edit className="h-3 w-3 text-[var(--color-warning)]" />,
  added: <PlusCircle className="h-3 w-3 text-[var(--color-ai)]" />,
  deleted: <AlertCircle className="h-3 w-3 text-[var(--color-destructive)]" />,
};

export function KeyList({
  files,
  entries,
  selectedKey,
  selectedFilePath,
  onSelectFile,
  onSelectKey,
}: KeyListProps) {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  const toggleFile = (path: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleFileClick = (file: L10nFileRef) => {
    onSelectFile(file);
    setExpandedFiles((prev) => new Set(prev).add(file.path));
  };

  return (
    <div className="flex flex-col overflow-y-auto no-scrollbar flex-1">
      <div className="px-3 py-2 label-caps text-[var(--color-muted-foreground)]">
        Explorer
      </div>

      {files.map((file) => {
        const isSelected = selectedFilePath === file.path;
        const expanded = expandedFiles.has(file.path) || isSelected;

        return (
          <div key={file.path}>
            <button
              onClick={() => {
                handleFileClick(file);
                toggleFile(file.path);
              }}
              className={cn(
                "flex w-full items-center gap-1.5 px-3 py-1.5 text-xs transition-colors",
                isSelected
                  ? "bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] text-[var(--color-primary)]"
                  : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-foreground)]"
              )}
            >
              {expanded ? (
                <ChevronDown className="h-3 w-3 shrink-0" />
              ) : (
                <ChevronRight className="h-3 w-3 shrink-0" />
              )}
              <FileJson className="h-3 w-3 shrink-0" />
              <span className="font-mono truncate text-left">
                {file.path.split("/").pop()}
              </span>
            </button>

            {expanded && isSelected && entries.length > 0 && (
              <div className="ml-4 border-l border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)]">
                {entries.map((entry) => (
                  <button
                    key={entry.key}
                    onClick={() => onSelectKey(entry.key)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors text-left",
                      selectedKey === entry.key
                        ? "bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] text-[var(--color-primary)]"
                        : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-foreground)]"
                    )}
                  >
                    <span className="shrink-0">{statusIcon[entry.status]}</span>
                    <span className="font-mono truncate opacity-70">{entry.key}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
