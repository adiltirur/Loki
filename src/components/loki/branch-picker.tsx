"use client";

import { useEffect, useState } from "react";
import { GitBranch, Loader2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GithubRepo } from "@/lib/github";

interface BranchPickerProps {
  repo: GithubRepo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (branch: string) => void;
}

export function BranchPicker({ repo, open, onOpenChange, onSelect }: BranchPickerProps) {
  const [branches, setBranches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(repo.defaultBranch);

  useEffect(() => {
    if (!open) return;
    setSelected(repo.defaultBranch);
    setQuery("");
    setLoading(true);
    setError(null);
    fetch(
      `/api/repos/${repo.owner}/${repo.name}/branches?installationId=${repo.installationId}`
    )
      .then((r) => r.json())
      .then((d: { branches?: string[]; error?: string }) => {
        if (d.error) throw new Error(d.error);
        setBranches(d.branches ?? []);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [open, repo.owner, repo.name, repo.installationId, repo.defaultBranch]);

  const filtered = branches.filter((b) =>
    b.toLowerCase().includes(query.toLowerCase())
  );

  const handleConfirm = () => {
    onSelect(selected);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Select branch
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-[var(--color-muted-foreground)] -mt-2 mb-2">
          {repo.owner}/{repo.name}
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-4 w-4 animate-spin text-[var(--color-muted-foreground)]" />
          </div>
        ) : error ? (
          <p className="text-xs text-[var(--color-destructive)] py-4">{error}</p>
        ) : (
          <>
            {/* Search */}
            <div className="flex items-center gap-2 rounded bg-[var(--color-surface-container)] px-2 py-1.5 mb-2">
              <Search className="h-3.5 w-3.5 text-[var(--color-muted-foreground)] shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter branches..."
                className="flex-1 bg-transparent text-xs text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] outline-none"
              />
            </div>

            {/* Branch list */}
            <div className="max-h-52 overflow-y-auto no-scrollbar space-y-0.5">
              {filtered.length === 0 ? (
                <p className="text-xs text-[var(--color-muted-foreground)] py-2 text-center">
                  No branches found
                </p>
              ) : (
                filtered.map((branch) => (
                  <button
                    key={branch}
                    onClick={() => setSelected(branch)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors text-left",
                      selected === branch
                        ? "bg-[var(--color-surface-container-high)] text-[var(--color-primary)]"
                        : "text-[var(--color-foreground)] hover:bg-[var(--color-surface-container-high)]"
                    )}
                  >
                    <GitBranch className="h-3 w-3 shrink-0 opacity-60" />
                    <span className="font-mono truncate">{branch}</span>
                    {branch === repo.defaultBranch && (
                      <span className="ml-auto text-[10px] opacity-50">default</span>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleConfirm} disabled={!selected}>
                Open editor
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
