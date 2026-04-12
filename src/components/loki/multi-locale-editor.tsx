"use client";

import { Sparkles, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ReviewActions } from "@/components/loki/review-actions";
import { cn } from "@/lib/utils";
import { getKeyEntry } from "@/lib/loki-lock";
import type { L10nFileGroup } from "@/lib/file-grouping";
import type { LokiLockData } from "@/lib/loki-lock";

const LOCALE_FLAG: Record<string, string> = {
  en: "🇬🇧", de: "🇩🇪", fr: "🇫🇷", es: "🇪🇸", it: "🇮🇹",
  pt: "🇵🇹", nl: "🇳🇱", pl: "🇵🇱", ru: "🇷🇺", ja: "🇯🇵",
  ko: "🇰🇷", zh: "🇨🇳", ar: "🇸🇦", tr: "🇹🇷", sv: "🇸🇪",
};

const LOCALE_NAME: Record<string, string> = {
  en: "English", de: "German", fr: "French", es: "Spanish", it: "Italian",
  pt: "Portuguese", nl: "Dutch", pl: "Polish", ru: "Russian", ja: "Japanese",
  ko: "Korean", zh: "Chinese", ar: "Arabic", tr: "Turkish", sv: "Swedish",
};

function localeName(locale: string) {
  const base = locale.split("-")[0];
  return LOCALE_NAME[base] ?? locale;
}

function localeFlag(locale: string) {
  const base = locale.split("-")[0];
  return LOCALE_FLAG[base] ?? "🌐";
}

interface MultiLocaleEditorProps {
  selectedKey: string;
  activeGroup: L10nFileGroup;
  lockData: LokiLockData;
  username: string;
  getEffectiveValue: (locale: string, key: string) => string | undefined;
  getOriginalValue: (locale: string, key: string) => string | undefined;
  isKeyMissing: (locale: string, key: string) => boolean;
  onUpdateValue: (locale: string, key: string, value: string) => void;
  onDeleteKey: (key: string) => void;
  onApprove: (key: string, locale: string, username: string, note?: string) => void;
  onReject: (key: string, locale: string, username: string, note?: string) => void;
  onTranslate: (locale: string, key: string) => void;
}

export function MultiLocaleEditor({
  selectedKey,
  activeGroup,
  lockData,
  username,
  getEffectiveValue,
  getOriginalValue,
  isKeyMissing,
  onUpdateValue,
  onDeleteKey,
  onApprove,
  onReject,
  onTranslate,
}: MultiLocaleEditorProps) {
  const { primaryLocale, files } = activeGroup;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto no-scrollbar p-4 gap-4">
      {/* Key name header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="label-caps text-[var(--color-muted-foreground)] mb-1">Key</p>
          <p className="font-mono text-sm text-[var(--color-primary)] opacity-70 break-all">
            {selectedKey}
          </p>
        </div>
        <button
          onClick={() => onDeleteKey(selectedKey)}
          className="flex items-center gap-1 text-xs text-[var(--color-destructive)] opacity-60 hover:opacity-100 transition-opacity shrink-0 ml-4"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>

      {/* Locale sections */}
      {files.map(({ locale }) => {
        const isPrimary = locale === primaryLocale;
        const effectiveValue = getEffectiveValue(locale, selectedKey) ?? "";
        const originalValue = getOriginalValue(locale, selectedKey);
        const missing = isKeyMissing(locale, selectedKey);
        const lockEntry = getKeyEntry(lockData, selectedKey, locale);
        const isEdited = effectiveValue !== originalValue && originalValue !== undefined;

        return (
          <div
            key={locale}
            className={cn(
              "rounded border border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)] overflow-hidden",
              isPrimary && "border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)]"
            )}
          >
            {/* Locale header */}
            <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-surface-container-lowest)]">
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">{localeFlag(locale)}</span>
                <span className="text-xs font-medium text-[var(--color-foreground)]">
                  {localeName(locale)}
                </span>
                <span className="font-mono text-[10px] text-[var(--color-muted-foreground)]">
                  {locale}
                </span>
                {isPrimary && (
                  <Badge variant="primary" className="text-[9px] px-1 py-0">source</Badge>
                )}
                {missing && (
                  <Badge variant="destructive" className="text-[9px] px-1 py-0">missing</Badge>
                )}
                {isEdited && !missing && (
                  <Badge variant="warning" className="text-[9px] px-1 py-0">edited</Badge>
                )}
              </div>

              {/* Review actions for non-primary locales */}
              {!isPrimary && (
                <ReviewActions
                  locale={locale}
                  keyName={selectedKey}
                  lockEntry={lockEntry}
                  username={username}
                  onApprove={(l, k, u, n) => onApprove(k, l, u, n)}
                  onReject={(l, k, u, n) => onReject(k, l, u, n)}
                />
              )}
            </div>

            {/* Textarea */}
            <div className="p-3">
              <textarea
                value={effectiveValue}
                onChange={(e) => onUpdateValue(locale, selectedKey, e.target.value)}
                placeholder={missing ? "Translation missing — enter value..." : ""}
                rows={3}
                className={cn(
                  "w-full rounded bg-[var(--color-surface-container-lowest)] p-0 font-mono text-xs text-[var(--color-foreground)]",
                  "placeholder:text-[var(--color-muted-foreground)] outline-none resize-none bg-transparent",
                  "focus:outline-none transition-all"
                )}
              />
            </div>

            {/* Translate button (non-primary only) */}
            {!isPrimary && (
              <div className="flex items-center justify-between px-3 pb-2">
                <div />
                <button
                  onClick={() => onTranslate(locale, selectedKey)}
                  className="flex items-center gap-1 text-[10px] text-[var(--color-primary)] opacity-70 hover:opacity-100 transition-opacity"
                >
                  <Sparkles className="h-3 w-3" />
                  Translate
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
