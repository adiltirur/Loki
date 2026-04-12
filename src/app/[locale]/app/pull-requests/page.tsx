import { useTranslations } from "next-intl";
import { PRList } from "@/components/loki/pr-list";

function PullRequestsContent() {
  const t = useTranslations("nav");
  return (
    <div>
      <h1 className="text-lg font-semibold mb-6">{t("pullRequests")}</h1>
      <PRList />
    </div>
  );
}

export default function PullRequestsPage() {
  return <PullRequestsContent />;
}
