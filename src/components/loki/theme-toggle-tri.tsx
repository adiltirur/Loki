"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface ThemeToggleTriProps {
  className?: string;
}

export function ThemeToggleTri({ className }: ThemeToggleTriProps) {
  const t = useTranslations("app.settings");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const options = [
    { value: "light", label: t("themeLight"), Icon: Sun },
    { value: "system", label: t("themeSystem"), Icon: Monitor },
    { value: "dark", label: t("themeDark"), Icon: Moon },
  ];

  const current = mounted ? theme ?? "system" : "system";

  return (
    <div
      role="radiogroup"
      aria-label={t("themeTitle")}
      className={cn(
        "inline-flex items-center rounded border border-[color-mix(in_srgb,var(--color-outline-variant)_25%,transparent)] bg-[var(--color-surface-container)] p-0.5 gap-0.5",
        className
      )}
    >
      {options.map(({ value, label, Icon }) => {
        const active = current === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            className={cn(
              "flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs transition-colors",
              "focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2",
              active
                ? "bg-[var(--color-surface-container-highest)] text-[var(--color-foreground)]"
                : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
