import { useTranslations } from "next-intl";
import { Globe, AlertCircle, GitPullRequest, Sparkles, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="p-4 hover:bg-[var(--color-surface-container-high)]">
      <CardContent className="p-0">
        <div className="flex items-start justify-between mb-2">
          <p className="label-caps text-[var(--color-muted-foreground)]">{label}</p>
          <Icon className="h-4 w-4 text-[var(--color-muted-foreground)]" />
        </div>
        <p className="text-3xl font-semibold text-[var(--color-primary)]">{value}</p>
        {sub && (
          <p className="text-xs text-[var(--color-muted-foreground)] mt-1">{sub}</p>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardContent({ locale }: { locale: string }) {
  const t = useTranslations("app.dashboard");

  const stats = [
    { label: t("totalKeys"), value: "12,482", sub: "+124 this week", icon: Globe },
    { label: t("missingTranslations"), value: "42", sub: "7%", icon: AlertCircle },
    { label: t("pendingPRs"), value: "8", sub: "Needs Review", icon: GitPullRequest },
    { label: t("aiSuggestions"), value: "312", sub: "78% accepted", icon: Sparkles },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Active Projects */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Active Projects</h2>
          <Link href={`/${locale}/app/projects`} className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1">
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="space-y-3">
          {[
            { name: "loki-core-engine", branch: "main", progress: 94, keys: 3, missing: 8 },
            { name: "loki-web-portal", branch: "v0.3.1", progress: 55, keys: 40, missing: 24 },
          ].map((proj) => (
            <div
              key={proj.name}
              className="rounded bg-[var(--color-card)] p-4 flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium font-mono truncate">{proj.name}</p>
                  <Badge variant="language">{proj.branch}</Badge>
                </div>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {proj.keys} on sync · {proj.missing} missing
                </p>
                <div className="mt-2 h-1 rounded-full bg-[var(--color-surface-container-high)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-accent)] transition-all"
                    style={{ width: `${proj.progress}%` }}
                  />
                </div>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                  Translation Progress · {proj.progress}%
                </p>
              </div>
              <Button size="sm" asChild>
                <Link href={`/${locale}/app/translations`}>{t("openEditor")}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Recent Activity</h2>
        <div className="space-y-2">
          {[
            { text: "Alex Chen merged PR #1438", sub: "2 hours ago · loki-core-engine", dot: "success" },
            { text: "Loki AI suggested 42 translations for Spanish (ES)", sub: "4 hours ago · loki-web-portal", dot: "ai" },
            { text: "System successfully synced translations with GitHub", sub: "Yesterday · All Projects", dot: "default" },
            { text: "Error: Failed to fetch translation keys from API", sub: "Yesterday · loki-core-engine", dot: "destructive" },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded bg-[var(--color-card)] p-3"
            >
              <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 bg-[var(--color-${item.dot})]`} />
              <div>
                <p className="text-xs font-medium">{item.text}</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <DashboardContent locale={locale} />;
}
