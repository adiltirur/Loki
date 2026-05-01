"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OrgEntry {
  id: string;
  name: string;
  slug: string;
}

interface OrgSwitcherProps {
  orgs: OrgEntry[];
  activeOrgId: string | null;
  collapsed?: boolean;
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function OrgSwitcher({ orgs, activeOrgId, collapsed = false }: OrgSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (orgs.length === 0) return null;
  const active = orgs.find((o) => o.id === activeOrgId) ?? orgs[0];
  const switchable = orgs.length > 1;

  function handleSwitch(orgId: string) {
    setOpen(false);
    if (orgId === active.id) return;
    startTransition(async () => {
      const res = await fetch("/api/session/switch-org", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orgId }),
      });
      if (res.ok) router.refresh();
    });
  }

  if (collapsed) {
    return (
      <div
        className="mx-2 mb-2 flex h-7 w-7 items-center justify-center rounded bg-[var(--color-surface-container)] text-[10px] font-semibold text-[var(--color-muted-foreground)]"
        title={active.name}
      >
        {initialsFor(active.name)}
      </div>
    );
  }

  return (
    <div className="relative px-3 mb-2">
      <button
        type="button"
        onClick={() => switchable && setOpen((v) => !v)}
        disabled={!switchable || pending}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-xs",
          "bg-[var(--color-surface-container)] text-[var(--color-foreground)]",
          switchable
            ? "hover:bg-[var(--color-surface-container-high)] cursor-pointer"
            : "cursor-default",
          "focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2"
        )}
      >
        <span className="truncate">{active.name}</span>
        {switchable && <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />}
      </button>

      {open && switchable && (
        <ul className="absolute left-3 right-3 top-full mt-1 z-30 rounded border border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)] bg-[var(--color-surface-container-highest)] p-1 shadow-ambient">
          {orgs.map((o) => (
            <li key={o.id}>
              <button
                onClick={() => handleSwitch(o.id)}
                className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-xs hover:bg-[var(--color-surface-container-high)]"
              >
                <span className="truncate">{o.name}</span>
                {o.id === active.id && <Check className="h-3 w-3" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
