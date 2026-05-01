import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { AdminTabs } from "@/app/[locale]/app/admin/admin-tabs";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/login`);
  if (session.user.role !== "super_admin") redirect(`/${locale}/app`);

  const orgs = await db.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { members: true } } },
  });

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { orgMembers: { include: { org: { select: { name: true, slug: true } } } } },
  });

  return (
    <AdminTabs
      orgs={orgs.map((o) => ({
        id: o.id,
        name: o.name,
        slug: o.slug,
        createdAt: o.createdAt.toISOString(),
        memberCount: o._count.members,
      }))}
      users={users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        image: u.image,
        githubLogin: u.githubLogin,
        role: u.role,
        createdAt: u.createdAt.toISOString(),
        orgs: u.orgMembers.map((m) => ({
          name: m.org.name,
          slug: m.org.slug,
          role: m.role,
        })),
      }))}
    />
  );
}
