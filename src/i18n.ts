import { getRequestConfig } from "next-intl/server";
import { LOKI_DEFAULT_LOCALE, LOKI_SUPPORTED_LOCALES } from "@/lib/constants";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (
    !locale ||
    !LOKI_SUPPORTED_LOCALES.includes(locale as (typeof LOKI_SUPPORTED_LOCALES)[number])
  ) {
    locale = LOKI_DEFAULT_LOCALE;
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
