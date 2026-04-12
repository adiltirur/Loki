import { useTranslations } from "next-intl";
import { GitBranch } from "lucide-react";
import { brand } from "@/config/brand";
import { Button } from "@/components/ui/button";

export function Hero() {
  const t = useTranslations("landing.hero");

  return (
    <section className="relative overflow-hidden py-24 px-4">
      {/* Mesh gradient background */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(at 0% 0%, rgba(37,99,235,0.12) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(96,1,209,0.08) 0px, transparent 50%)",
        }}
      />
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="mb-6 text-5xl font-semibold leading-tight tracking-tight md:text-6xl text-[var(--color-foreground)]">
          {t("headline")}
        </h1>
        <p className="mx-auto mb-10 max-w-xl text-lg text-[var(--color-muted-foreground)] leading-relaxed">
          {t("subheading")}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button size="lg" className="gap-2">
            {t("cta")}
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <a href={brand.github} target="_blank" rel="noopener noreferrer" className="gap-2">
              <GitBranch className="h-4 w-4" />
              {t("ctaSecondary")}
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
