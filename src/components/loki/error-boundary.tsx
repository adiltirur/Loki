"use client";

import { ErrorBoundary as Boundary, type FallbackProps } from "react-error-boundary";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

function DefaultFallback({ error, resetErrorBoundary }: FallbackProps) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "An unexpected error occurred.";
  return (
    <div role="alert" className="flex h-full min-h-[40vh] items-center justify-center px-6">
      <div className="max-w-sm rounded bg-[var(--color-card)] p-6 text-center border border-[color-mix(in_srgb,var(--color-destructive)_30%,transparent)]">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-destructive-container)] text-[var(--color-destructive)]">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h2 className="text-sm font-semibold">Something went wrong</h2>
        <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">{message}</p>
        <div className="mt-4">
          <Button size="sm" variant="secondary" onClick={resetErrorBoundary}>
            <RefreshCw className="h-3 w-3" /> Try again
          </Button>
        </div>
      </div>
    </div>
  );
}

interface AppErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<FallbackProps>;
}

export function AppErrorBoundary({ children, fallback }: AppErrorBoundaryProps) {
  return <Boundary FallbackComponent={fallback ?? DefaultFallback}>{children}</Boundary>;
}
