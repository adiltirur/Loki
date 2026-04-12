import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium label-caps transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-surface-container-high)] text-[var(--color-foreground)]",
        success:
          "bg-[var(--color-success-container)] text-[var(--color-tertiary)]",
        warning:
          "bg-[var(--color-warning-container)] text-[var(--color-warning)]",
        destructive:
          "bg-[var(--color-destructive-container)] text-[var(--color-destructive)]",
        ai:
          "border border-[color-mix(in_srgb,var(--color-secondary)_20%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary-container)_10%,transparent)] text-[var(--color-secondary)]",
        language:
          "bg-[var(--color-surface-container)] text-[var(--color-muted-foreground)]",
        permission:
          "bg-[var(--color-warning-container)] text-[var(--color-warning)]",
        primary:
          "bg-[var(--color-accent)] text-[var(--color-accent-foreground)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
