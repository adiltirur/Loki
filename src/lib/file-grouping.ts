import type { L10nFileRef } from "@/lib/github";

export interface L10nFileGroup {
  baseName: string;     // e.g. "app" from app_en.arb, or "" from en.json
  directory: string;    // e.g. "locales" or "lib/l10n"
  files: { locale: string; ref: L10nFileRef }[];
  primaryLocale: string; // "en" if present, else first alphabetically
}

// Locale code pattern: en, de, zh-Hans, pt-BR, sr-Latn-RS, etc.
const LOCALE_RE = /^[a-z]{2,3}(-[A-Za-z]{2,8}(-[A-Za-z0-9]{2,8})*)?$/;

/**
 * Parses a filename (without directory) and returns { baseName, locale } or null
 * if no locale can be detected.
 *
 * Supported patterns:
 *   en.json              → baseName: "", locale: "en"
 *   app_en.arb           → baseName: "app", locale: "en"
 *   messages_en.json     → baseName: "messages", locale: "en"
 *   strings.en.json      → baseName: "strings", locale: "en"
 *   en/common.json       (handled separately via directory locale)
 */
function parseFilename(filename: string): { baseName: string; locale: string } | null {
  // Remove extension
  const dotIdx = filename.lastIndexOf(".");
  const stem = dotIdx >= 0 ? filename.slice(0, dotIdx) : filename;

  // Pattern 1: stem is purely a locale code → en, de, zh-Hans
  if (LOCALE_RE.test(stem)) {
    return { baseName: "", locale: stem };
  }

  // Pattern 2: {base}_{locale} → app_en, messages_de
  const underscoreIdx = stem.lastIndexOf("_");
  if (underscoreIdx > 0) {
    const candidate = stem.slice(underscoreIdx + 1);
    if (LOCALE_RE.test(candidate)) {
      return { baseName: stem.slice(0, underscoreIdx), locale: candidate };
    }
  }

  // Pattern 3: {base}.{locale} → strings.en, app.de
  const dotStem = stem.lastIndexOf(".");
  if (dotStem > 0) {
    const candidate = stem.slice(dotStem + 1);
    if (LOCALE_RE.test(candidate)) {
      return { baseName: stem.slice(0, dotStem), locale: candidate };
    }
  }

  return null;
}

/**
 * Groups l10n files detected in a repo scan by language pairs.
 * Files in the same directory with the same base name but different locales
 * become one group.
 */
export function groupL10nFiles(files: L10nFileRef[]): L10nFileGroup[] {
  // Map from groupKey ("directory|||baseName") → group
  const map = new Map<string, L10nFileGroup>();

  for (const ref of files) {
    const lastSlash = ref.path.lastIndexOf("/");
    const directory = lastSlash >= 0 ? ref.path.slice(0, lastSlash) : "";
    const filename = lastSlash >= 0 ? ref.path.slice(lastSlash + 1) : ref.path;

    // Check if parent directory is a locale code (e.g. "locales/en/common.json")
    const parentDir = directory.split("/").pop() ?? "";
    let locale: string | null = null;
    let baseName: string | null = null;
    let groupDir = directory;

    if (LOCALE_RE.test(parentDir)) {
      // locale is the parent directory; strip it from the grouping directory
      locale = parentDir;
      baseName = filename.replace(/\.[^.]+$/, ""); // use full filename stem as base
      groupDir = directory.slice(0, directory.lastIndexOf("/"));
    } else {
      const parsed = parseFilename(filename);
      if (!parsed) continue; // can't detect locale — skip
      locale = parsed.locale;
      baseName = parsed.baseName;
    }

    const key = `${groupDir}|||${baseName}`;
    if (!map.has(key)) {
      map.set(key, {
        baseName,
        directory: groupDir,
        files: [],
        primaryLocale: "",
      });
    }

    const group = map.get(key)!;
    // Avoid duplicate locales
    if (!group.files.some((f) => f.locale === locale)) {
      group.files.push({ locale, ref });
    }
  }

  // Set primaryLocale and sort files within each group
  const groups: L10nFileGroup[] = [];
  for (const group of map.values()) {
    if (group.files.length === 0) continue;
    const locales = group.files.map((f) => f.locale).sort();
    group.primaryLocale = locales.includes("en") ? "en" : locales[0];
    // Sort files: primary locale first, then alphabetically
    group.files.sort((a, b) => {
      if (a.locale === group.primaryLocale) return -1;
      if (b.locale === group.primaryLocale) return 1;
      return a.locale.localeCompare(b.locale);
    });
    groups.push(group);
  }

  return groups;
}
