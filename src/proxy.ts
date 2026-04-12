import { auth } from "@/auth";
import createIntlMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { LOKI_SUPPORTED_LOCALES, LOKI_DEFAULT_LOCALE } from "@/lib/constants";

const intl = createIntlMiddleware({
  locales: LOKI_SUPPORTED_LOCALES,
  defaultLocale: LOKI_DEFAULT_LOCALE,
  localePrefix: "always",
});

// Matches /{locale}/app and any sub-path
const APP_ROUTE = /^\/[a-z]{2}((-[A-Za-z]{2,4})?)\/app/;

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (APP_ROUTE.test(pathname) && !req.auth) {
    const locale = pathname.split("/")[1] || LOKI_DEFAULT_LOCALE;
    return Response.redirect(new URL(`/${locale}/login`, req.url));
  }

  return intl(req as NextRequest);
});

export const config = {
  matcher: [
    // Skip Next.js internals, API routes, and static files
    "/((?!_next|_vercel|api|.*\\..*).*)",
    "/",
  ],
};
