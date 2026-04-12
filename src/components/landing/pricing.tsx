import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const planKeys = ["free", "pro", "team"] as const;

const planFeatures: Record<typeof planKeys[number], string[]> = {
  free: ["1 repo", "2 languages", "AI suggestions"],
  pro: ["10 repos", "Unlimited languages", "AI suggestions", "Ticket linking"],
  team: ["Unlimited repos", "Unlimited languages", "AI suggestions", "Ticket linking", "SSO"],
};

export function Pricing() {
  const t = useTranslations("landing.pricing");

  return (
    <section id="pricing" className="py-20 px-4">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-12 text-center text-3xl font-semibold">{t("title")}</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {planKeys.map((plan, i) => (
            <div
              key={plan}
              className={`rounded p-6 flex flex-col gap-4 transition-all duration-200 hover:-translate-y-0.5 ${
                i === 1
                  ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)] ring-1 ring-[var(--color-accent)]"
                  : "bg-[var(--color-card)] hover:bg-[var(--color-surface-container-high)]"
              }`}
            >
              <div>
                <p className="label-caps mb-1">{t(`${plan}.name` as any)}</p>
                <p className="text-2xl font-semibold">{t(`${plan}.price` as any)}</p>
                <p className={`text-xs mt-1 ${i === 1 ? "opacity-80" : "text-[var(--color-muted-foreground)]"}`}>
                  {t(`${plan}.description` as any)}
                </p>
              </div>

              <ul className="space-y-1.5 flex-1">
                {planFeatures[plan].map((feat) => (
                  <li key={feat} className="flex items-center gap-2 text-xs">
                    <Check className={`h-3 w-3 shrink-0 ${i === 1 ? "" : "text-[var(--color-success)]"}`} />
                    {feat}
                  </li>
                ))}
              </ul>

              <Button
                variant={i === 1 ? "secondary" : "default"}
                size="sm"
                className={i === 1 ? "border-white/40 text-white hover:bg-white/10" : ""}
              >
                Get started
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
