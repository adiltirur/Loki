import { useTranslations } from "next-intl";
import { GitBranch, Sparkles, GitPullRequest, Ticket, FileJson, Eye } from "lucide-react";

const featureIcons = {
  githubNative: GitBranch,
  aiSuggestions: Sparkles,
  prPublish: GitPullRequest,
  ticketLinking: Ticket,
  fileFormats: FileJson,
  readOnly: Eye,
};

export function Features() {
  const t = useTranslations("landing.features");

  const featureKeys = Object.keys(featureIcons) as Array<keyof typeof featureIcons>;

  return (
    <section id="features" className="py-20 px-4 bg-[var(--color-surface-container-low)]">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-12 text-center text-3xl font-semibold">{t("title")}</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featureKeys.map((key) => {
            const Icon = featureIcons[key];
            return (
              <div
                key={key}
                className="rounded p-5 bg-[var(--color-card)] group transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-surface-container-high)]"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)]">
                  <Icon className="h-4 w-4 text-[var(--color-primary)]" />
                </div>
                <h3 className="mb-1.5 text-sm font-semibold">{t(`${key}.title` as any)}</h3>
                <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">
                  {t(`${key}.description` as any)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
