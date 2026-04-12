"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Globe, Menu, X } from "lucide-react";
import { brand } from "@/config/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavbarProps {
  locale: string;
}

export function Navbar({ locale }: NavbarProps) {
  const t = useTranslations("nav");
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: "#features", label: t("features") },
    { href: "#how-it-works", label: t("howItWorks") },
    { href: "#pricing", label: t("pricing") },
    { href: "#docs", label: t("docs") },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[color-mix(in_srgb,var(--color-background)_80%,transparent)] backdrop-blur-md border-b border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)]">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-[var(--color-accent)]">
            <Globe className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-sm">{brand.name}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-2 ml-auto">
          <Button variant="secondary" size="sm" asChild>
            <a href={brand.github} target="_blank" rel="noopener noreferrer">
              {t("viewOnGitHub")}
            </a>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/${locale}/login`}>{t("getStarted")}</Link>
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="ml-auto flex md:hidden h-8 w-8 items-center justify-center rounded text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)] bg-[var(--color-background)] px-4 py-3 space-y-1">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2 space-y-2">
            <Button variant="secondary" size="sm" className="w-full">
              {t("viewOnGitHub")}
            </Button>
            <Button size="sm" className="w-full" asChild>
              <Link href={`/${locale}/login`}>{t("getStarted")}</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
