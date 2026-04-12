import { useTranslations } from "next-intl";
import { Download, ScanSearch, Pencil, GitPullRequest } from "lucide-react";

const icons = [Download, ScanSearch, Pencil, GitPullRequest];

export function HowItWorks() {
  const t = useTranslations("landing.howItWorks");

  const steps = [
    { key: "step1", icon: icons[0] },
    { key: "step2", icon: icons[1] },
    { key: "step3", icon: icons[2] },
    { key: "step4", icon: icons[3] },
  ] as const;

  return (
    <section id="how-it-works" className="py-20 px-4">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-12 text-center text-3xl font-semibold">{t("title")}</h2>

        <div className="relative flex flex-col md:flex-row items-start gap-8 md:gap-0">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-8 left-0 right-0 h-px bg-[color-mix(in_srgb,var(--color-outline-variant)_20%,transparent)]" />

          {steps.map(({ key, icon: Icon }, i) => (
            <div
              key={key}
              className="relative flex flex-col items-center text-center flex-1 md:px-4"
            >
              {/* Step circle */}
              <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface-container)] border border-[color-mix(in_srgb,var(--color-outline-variant)_20%,transparent)]">
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent)] text-[10px] font-bold text-white">
                  {i + 1}
                </span>
                <Icon className="h-6 w-6 text-[var(--color-primary)]" />
              </div>
              <h3 className="mb-2 text-sm font-semibold">{t(`${key}.title` as any)}</h3>
              <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed max-w-36">
                {t(`${key}.description` as any)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
