"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

interface TopbarState {
  breadcrumbs: string[];
  searchValue: string;
  searchPlaceholder: string;
  searchEnabled: boolean;
  readOnly: boolean;
}

interface TopbarContextValue extends TopbarState {
  setBreadcrumbs: (crumbs: string[]) => void;
  setSearchValue: (value: string) => void;
  setReadOnly: (readOnly: boolean) => void;
  configureSearch: (opts: { enabled: boolean; placeholder?: string }) => void;
}

const Ctx = createContext<TopbarContextValue | null>(null);

export function TopbarProvider({ children }: { children: React.ReactNode }) {
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [searchPlaceholder, setSearchPlaceholder] = useState("Search");
  const [readOnly, setReadOnly] = useState(false);

  const value = useMemo<TopbarContextValue>(
    () => ({
      breadcrumbs,
      searchValue,
      searchPlaceholder,
      searchEnabled,
      readOnly,
      setBreadcrumbs,
      setSearchValue,
      setReadOnly,
      configureSearch: ({ enabled, placeholder }) => {
        setSearchEnabled(enabled);
        if (placeholder !== undefined) setSearchPlaceholder(placeholder);
      },
    }),
    [breadcrumbs, searchValue, searchPlaceholder, searchEnabled, readOnly]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTopbar(): TopbarContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTopbar must be used inside <TopbarProvider>");
  return v;
}

interface UseTopbarConfig {
  breadcrumbs: string[];
  search?: { enabled: boolean; placeholder?: string };
  readOnly?: boolean;
}

/** Convenience: set topbar state from a page component on mount/update. */
export function useTopbarConfig({ breadcrumbs, search, readOnly }: UseTopbarConfig) {
  const ctx = useContext(Ctx);
  // Reset search value whenever the page changes its identity (breadcrumb shape).
  const breadcrumbKey = breadcrumbs.join("/");
  useEffect(() => {
    if (!ctx) return;
    ctx.setBreadcrumbs(breadcrumbs);
    ctx.configureSearch({
      enabled: search?.enabled ?? false,
      placeholder: search?.placeholder,
    });
    ctx.setReadOnly(readOnly ?? false);
    ctx.setSearchValue("");
    return () => {
      ctx.setBreadcrumbs([]);
      ctx.configureSearch({ enabled: false });
      ctx.setSearchValue("");
      ctx.setReadOnly(false);
    };
    // We intentionally key on the stable breadcrumbKey to avoid loops on
    // recreated array references.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breadcrumbKey, search?.enabled, search?.placeholder, readOnly]);
}
