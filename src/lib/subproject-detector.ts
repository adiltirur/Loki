/**
 * Sub-project detection for monorepos.
 *
 * A sub-project is a logical grouping of localization files that share a
 * common parent directory (e.g. `apps/web/lib/l10n` and `packages/shared/i18n`
 * become two sub-projects). The grouping key is the directory holding the
 * l10n files, with one tweak: when that directory's basename is a generic
 * i18n folder name (`l10n`, `i18n`, `locales`, etc.), we walk up one level
 * so the sub-project takes its name from the meaningful ancestor.
 */

export interface DetectedSubProject {
  name: string;
  rootPath: string;
  files: string[];
}

const GENERIC_DIR_NAMES = new Set([
  "l10n",
  "i18n",
  "translations",
  "translation",
  "locales",
  "locale",
  "strings",
  "lang",
  "languages",
  "messages",
]);

/**
 * Locale code pattern (e.g. en, de, zh-Hans, pt-BR). Mirrors the pattern in
 * file-grouping.ts so we can also strip locale-named directories like
 * `locales/en/common.json` → root `locales`.
 */
const LOCALE_RE = /^[a-z]{2,3}(-[A-Za-z]{2,8}(-[A-Za-z0-9]{2,8})*)?$/;

function dirOf(path: string): string {
  const idx = path.lastIndexOf("/");
  return idx >= 0 ? path.slice(0, idx) : "";
}

function basename(path: string): string {
  const idx = path.lastIndexOf("/");
  return idx >= 0 ? path.slice(idx + 1) : path;
}

/**
 * Walk up the directory until the basename is something meaningful — i.e.
 * not a generic i18n folder name and not a locale code. Empty string means
 * we hit the repo root.
 */
function meaningfulRoot(directory: string): string {
  let current = directory;
  while (current.length > 0) {
    const name = basename(current);
    if (!GENERIC_DIR_NAMES.has(name.toLowerCase()) && !LOCALE_RE.test(name)) {
      return current;
    }
    const parent = dirOf(current);
    if (parent === current) break;
    current = parent;
  }
  return current; // empty string when we reach repo root
}

function deriveName(rootPath: string): string {
  if (!rootPath) return "root";
  const name = basename(rootPath);
  return name || "root";
}

export function detectSubProjects(filePaths: string[]): DetectedSubProject[] {
  // Group files by their meaningful root directory.
  const groups = new Map<string, string[]>();
  for (const path of filePaths) {
    const directory = dirOf(path);
    const root = meaningfulRoot(directory);
    const list = groups.get(root) ?? [];
    list.push(path);
    groups.set(root, list);
  }

  const out: DetectedSubProject[] = [];
  for (const [rootPath, files] of groups.entries()) {
    out.push({
      name: deriveName(rootPath),
      rootPath,
      files: files.slice().sort(),
    });
  }

  // Shallowest paths first; deterministic name tiebreak.
  out.sort((a, b) => {
    const da = a.rootPath ? a.rootPath.split("/").length : 0;
    const db = b.rootPath ? b.rootPath.split("/").length : 0;
    if (da !== db) return da - db;
    return a.name.localeCompare(b.name);
  });

  return out;
}
