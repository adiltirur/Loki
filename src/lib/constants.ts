export const LOKI_SUPPORTED_LOCALES = ["en", "de"] as const;
export const LOKI_DEFAULT_LOCALE = "en";
export const LOKI_SUPPORTED_FILE_TYPES = [".arb", ".json"] as const;
export const LOKI_BRANCH_PREFIX = "loki/translations";
export const LOKI_PR_DESCRIPTION_TEMPLATE =
  "Translation update via Loki\n\nChanged keys: {count}\nFiles: {files}\nTicket: {ticket}{approvalStats}";

export const LOKI_PERMISSION = {
  READ: "read",
  READ_WRITE: "read_write",
} as const;

export const LOKI_KEY_STATUS = {
  TRANSLATED: "translated",
  MISSING: "missing",
  AI_SUGGESTED: "ai_suggested",
  EDITED: "edited",
} as const;

export const LOKI_PR_STATUS = {
  OPEN: "open",
  MERGED: "merged",
  CLOSED: "closed",
} as const;
