"use client";

import { useEffect, useState } from "react";
import { FolderTree, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface SubProjectOption {
  id?: string;
  name: string;
  rootPath: string;
  fileCount: number;
  files?: string[];
}

interface SubProjectPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owner: string;
  repo: string;
  branch: string;
  /**
   * Called with the picked sub-project. If null, treat as "no sub-project
   * filter" (skip selection — typical when only one sub-project is detected).
   */
  onSelect: (subProject: SubProjectOption | null) => void;
}

export function SubProjectPicker({
  open,
  onOpenChange,
  owner,
  repo,
  branch,
  onSelect,
}: SubProjectPickerProps) {
  const t = useTranslations("app.subProjects");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<SubProjectOption[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      // Step 1: try the cached listing.
      const cached = await fetch(
        `/api/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/subprojects?branch=${encodeURIComponent(branch)}`
      );
      let list: SubProjectOption[] | null = null;
      if (cached.ok) {
        const data = await cached.json();
        list = (data.subProjects ?? []).map((sp: { id: string; name: string; rootPath: string; files: string[] }) => ({
          id: sp.id,
          name: sp.name,
          rootPath: sp.rootPath,
          fileCount: sp.files.length,
          files: sp.files,
        }));
      }

      // Step 2: if we have nothing cached, scan now.
      if (!list || list.length === 0) {
        const scan = await fetch(
          `/api/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/scan?branch=${encodeURIComponent(branch)}`
        );
        if (!scan.ok) {
          if (!cancelled) {
            setError(t("scanError"));
            setLoading(false);
          }
          return;
        }
        const data = await scan.json();
        list = ((data.subProjects ?? []) as { name: string; rootPath: string; files: string[] }[]).map((sp) => ({
          name: sp.name,
          rootPath: sp.rootPath,
          fileCount: sp.files.length,
          files: sp.files,
        }));
      }

      if (cancelled) return;
      setItems(list);
      setLoading(false);

      // Auto-skip if there's exactly one (or none).
      if (list.length <= 1) {
        onSelect(list[0] ?? null);
        onOpenChange(false);
      }
    })().catch((err) => {
      if (cancelled) return;
      setError(err.message ?? t("scanError"));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [open, owner, repo, branch, onSelect, onOpenChange, t]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", { repo: `${owner}/${repo}`, branch })}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-[var(--color-muted-foreground)] text-sm gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("scanning")}
          </div>
        ) : error ? (
          <p className="text-xs text-[var(--color-destructive)]">{error}</p>
        ) : (
          <ul className="space-y-1.5 max-h-[60vh] overflow-y-auto">
            {items.map((sp) => (
              <li key={sp.rootPath || "__root__"}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(sp);
                    onOpenChange(false);
                  }}
                  className="flex w-full items-start gap-3 rounded px-3 py-2.5 text-left bg-[var(--color-surface-container)] hover:bg-[var(--color-surface-container-high)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2"
                >
                  <FolderTree className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{sp.name}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)] font-mono truncate">
                      {sp.rootPath || "/"}
                    </p>
                  </div>
                  <span className="text-xs text-[var(--color-muted-foreground)] shrink-0 self-center">
                    {sp.fileCount === 1
                      ? t("fileCountOne")
                      : t("fileCountOther", { count: sp.fileCount })}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
