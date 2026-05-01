import NextAuth, { type DefaultSession } from "next-auth";
import GitHub from "next-auth/providers/github";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { LOKI_DEFAULT_LOCALE } from "@/lib/constants";
import type { UserRole } from "@/lib/roles";

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim();

export const {
  handlers,
  auth,
  signIn,
  signOut,
  unstable_update: updateSession,
} = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(db),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      // Same email across providers (GitHub + magic link) maps to one User row.
      allowDangerousEmailAccountLinking: true,
      authorization: { params: { scope: "read:user user:email" } },
    }),
    Resend({
      from: process.env.RESEND_FROM,
      apiKey: process.env.RESEND_API_KEY,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user?.email || !user.id) return true;
      const email = user.email.toLowerCase();

      const updates: { githubLogin?: string; role?: UserRole } = {};
      if (account?.provider === "github") {
        const login = (profile as { login?: string } | undefined)?.login;
        if (login) updates.githubLogin = login;
      }
      if (SUPER_ADMIN_EMAIL && email === SUPER_ADMIN_EMAIL) {
        updates.role = "super_admin";
      }
      if (Object.keys(updates).length > 0) {
        await db.user.update({ where: { id: user.id }, data: updates });
      }
      return true;
    },
    async jwt({ token, user, account, trigger, session }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      if (user?.id) {
        token.userId = user.id;
      }

      // Refresh user fields + activeOrgId on sign-in / sign-up / explicit update.
      const shouldRefresh =
        trigger === "signIn" || trigger === "signUp" || trigger === "update";
      if (shouldRefresh && token.userId) {
        const dbUser = await db.user.findUnique({
          where: { id: token.userId as string },
          include: { orgMembers: { orderBy: { createdAt: "asc" } } },
        });
        if (dbUser) {
          token.userRole = dbUser.role as UserRole;
          token.email = dbUser.email;
          token.name = dbUser.name ?? undefined;
          token.picture = dbUser.image ?? undefined;
          token.githubLogin = dbUser.githubLogin ?? undefined;

          const orgIds = dbUser.orgMembers.map((m) => m.orgId);
          // Allow update() to override activeOrgId if the new value is a valid org.
          if (
            trigger === "update" &&
            session &&
            typeof (session as { activeOrgId?: string }).activeOrgId === "string"
          ) {
            const requested = (session as { activeOrgId: string }).activeOrgId;
            if (orgIds.includes(requested)) token.activeOrgId = requested;
          }
          if (!token.activeOrgId || !orgIds.includes(token.activeOrgId as string)) {
            token.activeOrgId = orgIds[0] ?? null;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        accessToken: (token.accessToken as string | undefined) ?? null,
        activeOrgId: (token.activeOrgId as string | null) ?? null,
        user: {
          ...session.user,
          id: (token.userId as string) ?? "",
          role: (token.userRole as UserRole | undefined) ?? "member",
          email: (token.email as string | undefined) ?? session.user?.email ?? null,
          name: (token.name as string | undefined) ?? null,
          image: (token.picture as string | undefined) ?? null,
          githubLogin: (token.githubLogin as string | undefined) ?? null,
        },
      };
    },
  },
  pages: {
    signIn: `/${LOKI_DEFAULT_LOCALE}/login`,
    verifyRequest: `/${LOKI_DEFAULT_LOCALE}/login?check=email`,
    error: `/unauthorized`,
  },
});

declare module "next-auth" {
  interface Session {
    accessToken: string | null;
    activeOrgId: string | null;
    user: {
      id: string;
      role: UserRole;
      githubLogin: string | null;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    accessToken?: string;
    userId?: string;
    userRole?: UserRole;
    githubLogin?: string;
    activeOrgId?: string | null;
  }
}
