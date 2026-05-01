import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-6 py-12 rounded bg-[var(--color-card)] border border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)]",
        className
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-container-high)] text-[var(--color-muted-foreground)] mb-3">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-medium text-[var(--color-foreground)]">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-xs text-[var(--color-muted-foreground)] leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-4">
          {action.href ? (
            <Button asChild size="sm">
              <a href={action.href}>{action.label}</a>
            </Button>
          ) : (
            <Button size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
