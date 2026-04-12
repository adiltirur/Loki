import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";

// ─── Clients ────────────────────────────────────────────────────────────────

export function getUserOctokit(accessToken: string) {
  return new Octokit({ auth: accessToken });
}

export async function getInstallationOctokit(installationId: number) {
  const appOctokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_APP_ID!,
      privateKey: (process.env.GITHUB_APP_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
    },
  });

  const { token } = (await (appOctokit.auth as Function)({
    type: "installation",
    installationId,
  })) as { token: string };

  return new Octokit({ auth: token });
}

// ─── Repo listing ────────────────────────────────────────────────────────────

export interface GithubRepo {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  defaultBranch: string;
  private: boolean;
  installationId: number;
  permissions: {
    contents: "read" | "write" | "none";
    pullRequests: "read" | "write" | "none";
  };
}

export async function listReposForInstallation(
  installationId: number
): Promise<GithubRepo[]> {
  const octokit = await getInstallationOctokit(installationId);
  const { data } = await octokit.apps.listReposAccessibleToInstallation({
    per_page: 100,
  });

  // Get installation permissions
  const appOctokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_APP_ID!,
      privateKey: (process.env.GITHUB_APP_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
    },
  });
  const { data: installation } = await appOctokit.apps.getInstallation({
    installation_id: installationId,
  });

  const contentsPermission =
    (installation.permissions?.contents as "read" | "write" | undefined) ?? "read";
  const prPermission =
    (installation.permissions?.pull_requests as "read" | "write" | undefined) ?? "none";

  return data.repositories.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    owner: repo.owner?.login ?? "",
    defaultBranch: repo.default_branch ?? "main",
    private: repo.private ?? false,
    installationId,
    permissions: {
      contents: contentsPermission,
      pullRequests: prPermission,
    },
  }));
}

// ─── L10n file detection ─────────────────────────────────────────────────────

const L10N_DIRS = new Set([
  "locales", "locale", "l10n", "i18n", "translations",
  "translation", "intl", "lang", "languages",
]);

const LOCALE_FILE_PATTERN =
  /^([a-z]{2}(-[A-Z]{2,4})?|[a-z]{2}_[A-Z]{2}|strings?|messages?|translations?|intl)\.(json|arb)$/i;

export function isL10nFile(filePath: string): boolean {
  const parts = filePath.split("/");
  const filename = parts[parts.length - 1] ?? "";

  // Always treat .arb as l10n
  if (filename.endsWith(".arb")) return true;

  // Parent directory is a l10n dir
  if (parts.length >= 2) {
    const parent = parts[parts.length - 2].toLowerCase();
    if (L10N_DIRS.has(parent) && filename.endsWith(".json")) return true;
  }

  // Ancestor directory is a l10n dir
  if (parts.some((p) => L10N_DIRS.has(p.toLowerCase())) && filename.endsWith(".json")) {
    return true;
  }

  // Filename matches common l10n patterns
  return LOCALE_FILE_PATTERN.test(filename);
}

// ─── Repo scanning ────────────────────────────────────────────────────────────

export interface L10nFileRef {
  path: string;
  sha: string;
  format: "arb" | "json";
}

export async function scanRepo(
  installationId: number,
  owner: string,
  repo: string,
  branch: string
): Promise<L10nFileRef[]> {
  const octokit = await getInstallationOctokit(installationId);

  const { data: tree } = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: branch,
    recursive: "1",
  });

  if (tree.truncated) {
    // Very large repos — only scan first 100k files (GitHub limit)
    console.warn("Repo tree truncated, results may be incomplete");
  }

  return (tree.tree ?? [])
    .filter(
      (item) =>
        item.type === "blob" &&
        item.path &&
        isL10nFile(item.path) &&
        item.sha
    )
    .map((item) => ({
      path: item.path!,
      sha: item.sha!,
      format: item.path!.endsWith(".arb") ? "arb" : "json",
    }));
}

// ─── File content parsing ─────────────────────────────────────────────────────

export interface L10nEntry {
  key: string;
  value: string;
}

export interface L10nFileContent {
  entries: L10nEntry[];
  raw: Record<string, unknown>;
  sha: string; // blob SHA — needed to update the file
  format: "arb" | "json";
}

export async function getFileContent(
  installationId: number,
  owner: string,
  repo: string,
  path: string,
  ref: string
): Promise<L10nFileContent> {
  const octokit = await getInstallationOctokit(installationId);
  const { data } = await octokit.repos.getContent({ owner, repo, path, ref });

  if (Array.isArray(data) || data.type !== "file") {
    throw new Error(`${path} is not a file`);
  }

  const text = Buffer.from(data.content, "base64").toString("utf-8");
  const parsed = JSON.parse(text) as Record<string, unknown>;
  const isArb = path.endsWith(".arb");
  const entries = flattenEntries(parsed, isArb);

  return { entries, raw: parsed, sha: data.sha, format: isArb ? "arb" : "json" };
}

function flattenEntries(
  obj: Record<string, unknown>,
  isArb: boolean,
  prefix = ""
): L10nEntry[] {
  const out: L10nEntry[] = [];
  for (const [k, v] of Object.entries(obj)) {
    // Skip ARB metadata keys
    if (isArb && (k.startsWith("@@") || k.startsWith("@"))) continue;
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") {
      out.push({ key: fullKey, value: v });
    } else if (typeof v === "object" && v !== null && !Array.isArray(v) && !isArb) {
      out.push(...flattenEntries(v as Record<string, unknown>, false, fullKey));
    }
  }
  return out;
}

// ─── Serialization ────────────────────────────────────────────────────────────

export function serializeEntries(
  entries: L10nEntry[],
  originalRaw: Record<string, unknown>,
  format: "arb" | "json"
): string {
  if (format === "arb") {
    const result: Record<string, unknown> = {};
    // Preserve ARB metadata (@@locale, @keyName, etc.)
    for (const [k, v] of Object.entries(originalRaw)) {
      if (k.startsWith("@@") || k.startsWith("@")) result[k] = v;
    }
    for (const { key, value } of entries) {
      result[key] = value;
    }
    return JSON.stringify(result, null, 2) + "\n";
  }

  // JSON: rebuild nested structure from dot-notation flat keys
  const result: Record<string, unknown> = JSON.parse(JSON.stringify(originalRaw));
  for (const { key, value } of entries) {
    setDeep(result, key.split("."), value);
  }
  return JSON.stringify(result, null, 2) + "\n";
}

function setDeep(obj: Record<string, unknown>, keys: string[], value: string) {
  const last = keys[keys.length - 1];
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (typeof cur[k] !== "object" || cur[k] === null) cur[k] = {};
    cur = cur[k] as Record<string, unknown>;
  }
  cur[last] = value;
}

// ─── PR creation ──────────────────────────────────────────────────────────────

export interface CreatePROptions {
  owner: string;
  repo: string;
  baseBranch: string;
  newBranch: string;
  files: { path: string; content: string }[];
  title: string;
  body: string;
}

export interface PRResult {
  url: string;
  number: number;
}

export async function createPR(
  installationId: number,
  opts: CreatePROptions
): Promise<PRResult> {
  const { owner, repo, baseBranch, newBranch, files, title, body } = opts;
  const octokit = await getInstallationOctokit(installationId);

  // 1. Get base branch SHA
  const { data: baseRef } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${baseBranch}`,
  });
  const baseSha = baseRef.object.sha;

  // 2. Get base tree SHA
  const { data: baseCommit } = await octokit.git.getCommit({
    owner,
    repo,
    commit_sha: baseSha,
  });

  // 3. Create blobs and tree items
  const treeItems = await Promise.all(
    files.map(async (file) => {
      const { data: blob } = await octokit.git.createBlob({
        owner,
        repo,
        content: Buffer.from(file.content).toString("base64"),
        encoding: "base64",
      });
      return {
        path: file.path,
        mode: "100644" as const,
        type: "blob" as const,
        sha: blob.sha,
      };
    })
  );

  // 4. Create new tree
  const { data: newTree } = await octokit.git.createTree({
    owner,
    repo,
    base_tree: baseCommit.tree.sha,
    tree: treeItems,
  });

  // 5. Create commit
  const { data: newCommit } = await octokit.git.createCommit({
    owner,
    repo,
    message: title,
    tree: newTree.sha,
    parents: [baseSha],
  });

  // 6. Create branch ref
  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${newBranch}`,
    sha: newCommit.sha,
  });

  // 7. Open PR
  const { data: pr } = await octokit.pulls.create({
    owner,
    repo,
    title,
    body,
    head: newBranch,
    base: baseBranch,
  });

  return { url: pr.html_url, number: pr.number };
}
