import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          // Minimal scopes — repo access is via GitHub App, not OAuth token
          scope: "read:user user:email",
        },
      },
    }),
  ],
  callbacks: {
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
    signIn: "/en/login",
    error: "/en/login",
  },
});
