import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { LOKI_DEFAULT_LOCALE } from "@/lib/constants";

// Parse allowlist once at module load — not on every sign-in
const ALLOWED_USERS = (process.env.ALLOWED_GITHUB_USERS ?? "")
  .split(",")
  .map((u) => u.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  // trustHost: required when running behind a reverse proxy (Caddy)
  // Accepts X-Forwarded-Host header — ensure Caddy is the only entry point
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
    signIn({ account, profile }) {
      // Only enforce allowlist on initial OAuth sign-in (account is present).
      // Session/JWT refreshes have no account — pass through unconditionally.
      if (!account) return true;
      if (ALLOWED_USERS.length === 0) return true; // no allowlist = open
      // profile should always be present when account is present for GitHub OAuth,
      // but guard defensively in case of provider misconfiguration or future changes.
      const login = (profile as { login?: string } | undefined)?.login?.toLowerCase();
      if (!login) {
        console.warn("[loki] signIn: OAuth account present but GitHub profile missing login — denying");
        return "/unauthorized";
      }
      if (!ALLOWED_USERS.includes(login)) {
        console.warn(`[loki] signIn: access denied for GitHub user '${login}'`);
        return "/unauthorized";
      }
      return true;
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
    error: `/unauthorized`,
  },
});
