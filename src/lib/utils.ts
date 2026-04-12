import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { LOKI_BRANCH_PREFIX } from "@/lib/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function lokiBranchName(): string {
  const now = new Date();
  const ts = now.toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  return `${LOKI_BRANCH_PREFIX}-${ts}`;
}
