import { Sidebar } from "@/components/loki/sidebar";
import { Topbar } from "@/components/loki/topbar";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar locale={locale} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar breadcrumbs={["PROJECT", "BRANCH", "FILE"]} readOnly={false} />
        <main className="flex-1 overflow-auto no-scrollbar p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
