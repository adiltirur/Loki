import { useTranslations } from "next-intl";
import Link from "next/link";

interface FooterProps {
  locale: string;
}

export function Footer({ locale }: FooterProps) {
  const t = useTranslations("landing.footer");

  return (
    <footer className="border-t border-[color-mix(in_srgb,var(--color-outline-variant)_15%,transparent)] py-8 px-4">
      <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--color-muted-foreground)]">
        <span>{t("copyright")}</span>
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/privacy`} className="hover:text-[var(--color-foreground)] transition-colors">
            {t("privacy")}
          </Link>
          <Link href={`/${locale}/terms`} className="hover:text-[var(--color-foreground)] transition-colors">
            {t("terms")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
