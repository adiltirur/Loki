import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/loki/sidebar";
import { Topbar } from "@/components/loki/topbar";
import { TopbarProvider } from "@/components/loki/topbar-context";
import { AppErrorBoundary } from "@/components/loki/error-boundary";
import { NoOrgScreen } from "@/components/loki/no-org-screen";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const isSuperAdmin = session.user.role === "super_admin";
  let orgs: { id: string; name: string; slug: string }[];
  if (isSuperAdmin) {
    const all = await db.organization.findMany({ orderBy: { createdAt: "desc" } });
    orgs = all.map((o) => ({ id: o.id, name: o.name, slug: o.slug }));
  } else {
    const memberships = await db.orgMember.findMany({
      where: { userId: session.user.id },
      include: { org: true },
      orderBy: { createdAt: "asc" },
    });
    orgs = memberships.map((m) => ({ id: m.org.id, name: m.org.name, slug: m.org.slug }));
  }

  if (!session.activeOrgId && !isSuperAdmin) {
    return <NoOrgScreen session={session} />;
  }

  const sidebarSession = {
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    image: session.user.image ?? null,
    role: session.user.role,
    githubLogin: session.user.githubLogin,
  };

  return (
    <TopbarProvider>
      <div className="flex h-screen overflow-hidden bg-[var(--color-background)] text-[var(--color-foreground)]">
        <Sidebar
          locale={locale}
          session={sidebarSession}
          orgs={orgs}
          activeOrgId={session.activeOrgId}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-auto no-scrollbar p-6">
            <AppErrorBoundary>{children}</AppErrorBoundary>
          </main>
        </div>
      </div>
    </TopbarProvider>
  );
}
