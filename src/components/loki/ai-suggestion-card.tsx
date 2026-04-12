"use client";

import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AISuggestionCardProps {
  suggestion: string;
  confidence?: number;
  onAccept?: (value: string) => void;
  onDismiss?: () => void;
  className?: string;
}

export function AISuggestionCard({
  suggestion,
  confidence,
  onAccept,
  onDismiss,
  className,
}: AISuggestionCardProps) {
  const t = useTranslations("app.editor");

  return (
    <div
      className={cn(
        "rounded p-3 transition-all duration-200",
        "border border-[color-mix(in_srgb,var(--color-secondary)_20%,transparent)]",
        "bg-[color-mix(in_srgb,var(--color-secondary-container)_10%,transparent)]",
        "backdrop-blur-sm",
        className
      )}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="h-3.5 w-3.5 text-[var(--color-secondary)]" />
        <span className="label-caps text-[var(--color-secondary)]">
          {t("aiSuggestion")}
        </span>
        {confidence !== undefined && (
          <span className="ml-auto label-caps text-[var(--color-muted-foreground)]">
            {confidence}%
          </span>
        )}
      </div>
      <p className="font-mono text-xs text-[var(--color-foreground)] leading-relaxed mb-3">
        &ldquo;{suggestion}&rdquo;
      </p>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => onAccept?.(suggestion)}
          className="text-xs h-6 px-3"
        >
          {t("accept")}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDismiss}
          className="text-xs h-6 px-3"
        >
          {t("dismiss")}
        </Button>
      </div>
    </div>
  );
}
