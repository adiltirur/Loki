"use client";

import { useEffect, useState } from "react";
import { GitBranch, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GithubStatus {
  connected: boolean;
  installationId: number | null;
  installedBy: string | null;
}

interface Props {
  orgId: string | null;
  canManage: boolean;
}

export function GithubIntegrationCard({ orgId, canManage }: Props) {
  const [status, setStatus] = useState<GithubStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) {
      setStatus({ connected: false, installationId: null, installedBy: null });
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/orgs/${orgId}/github-status`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setStatus(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Failed to load status");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  const appName = process.env.NEXT_PUBLIC_GITHUB_APP_NAME;
  const installUrl = orgId && appName
    ? `https://github.com/apps/${appName}/installations/new?state=${orgId}`
    : null;

  async function handleDisconnect() {
    if (!orgId) return;
    if (!confirm("Disconnect GitHub for this organization?")) return;
    setLoading(true);
    const res = await fetch(`/api/orgs/${orgId}/github`, { method: "DELETE" });
    if (res.ok) {
      setStatus({ connected: false, installationId: null, installedBy: null });
    } else {
      setError("Failed to disconnect");
    }
    setLoading(false);
  }

  return (
    <div className="rounded bg-[var(--color-card)] p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <GitBranch className="h-5 w-5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium">GitHub</p>
            <div className="flex items-center gap-1 mt-0.5">
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin text-[var(--color-muted-foreground)]" />
              ) : status?.connected ? (
                <>
                  <Check className="h-3 w-3 text-[var(--color-success)]" />
                  <span className="text-xs text-[var(--color-success)]">
                    Connected{status.installedBy ? ` · installed by ${status.installedBy}` : ""}
                  </span>
                </>
              ) : (
                <>
                  <X className="h-3 w-3 text-[var(--color-muted-foreground)]" />
                  <span className="text-xs text-[var(--color-muted-foreground)]">Not connected</span>
                </>
              )}
            </div>
          </div>
        </div>

        {canManage && !loading && (
          <div className="flex items-center gap-2 shrink-0">
            {status?.connected ? (
              <Button size="sm" variant="secondary" onClick={handleDisconnect}>
                Disconnect
              </Button>
            ) : (
              installUrl && (
                <Button size="sm" asChild>
                  <a href={installUrl}>Connect GitHub</a>
                </Button>
              )
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 text-xs text-[var(--color-destructive)]">{error}</p>
      )}
      {!orgId && (
        <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">
          Select an active organization first.
        </p>
      )}
    </div>
  );
}
