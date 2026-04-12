"use client";

import Link from "next/link";
import { brand } from "@/config/brand";

export default function UnauthorizedPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "hsl(var(--background))" }}
    >
      <div className="w-full max-w-sm text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-surface-container-high)] mx-auto mb-6">
          <svg className="h-6 w-6 text-[var(--color-destructive)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">
          Access Denied
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mb-8 leading-relaxed">
          Your GitHub account is not authorised to access {brand.name}.<br />
          Contact the admin to request access.
        </p>
        <Link
          href="/en/login"
          className="text-xs text-[var(--color-primary)] hover:underline"
        >
          ← Back to login
        </Link>
      </div>
    </div>
  );
}
