import { redirect } from "next/navigation";
import { LOKI_DEFAULT_LOCALE } from "@/lib/constants";

export default function RootPage() {
  redirect(`/${LOKI_DEFAULT_LOCALE}`);
}
