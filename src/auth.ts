import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { LOKI_DEFAULT_LOCALE } from "@/lib/constants";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    signIn({ profile }) {
      const allowed = (process.env.ALLOWED_GITHUB_USERS ?? "")
        .split(",")
        .map((u) => u.trim().toLowerCase())
        .filter(Boolean);
      if (allowed.length === 0) return true; // no allowlist = open
      const login = (profile as { login?: string })?.login?.toLowerCase() ?? "";
      return allowed.includes(login);
    },
    jwt({ token, account, profile }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      if (profile) {
        const p = profile as { login?: string; id?: number; sub?: string };
        token.login = p.login;
        token.id = String(p.id ?? p.sub ?? "");
      }
      return token;
    },
    session({ session, token }) {
      return {
        ...session,
        accessToken: token.accessToken as string,
        user: {
          ...session.user,
          login: token.login as string,
          id: token.id as string,
        },
      };
    },
  },
  pages: {
    signIn: `/${LOKI_DEFAULT_LOCALE}/login`,
    error: `/${LOKI_DEFAULT_LOCALE}/login`,
  },
});
