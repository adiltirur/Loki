import { Globe, LogOut } from "lucide-react";
import { brand } from "@/config/brand";
import { SignOutButton } from "@/components/loki/sign-out-button";
import type { Session } from "next-auth";

interface NoOrgScreenProps {
  session: Session;
}

export function NoOrgScreen({ session }: NoOrgScreenProps) {
  const email = session.user?.email ?? "";

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg p-10 bg-[var(--color-card)] border border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)] text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent)]">
          <Globe className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-lg font-semibold">{brand.name}</h1>
        <p className="mt-3 text-sm text-[var(--color-foreground)]">
          You&apos;re not part of any organization yet.
        </p>
        <p className="mt-2 text-xs text-[var(--color-muted-foreground)] leading-relaxed">
          Ask your {brand.name} admin to invite you to an organization. Once
          invited, sign in again with this email and you&apos;ll be added
          automatically.
        </p>
        {email && (
          <p className="mt-4 inline-flex rounded bg-[var(--color-surface-container)] px-3 py-1.5 text-xs text-[var(--color-muted-foreground)] font-mono">
            {email}
          </p>
        )}
        <div className="mt-6">
          <SignOutButton>
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out</span>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}
