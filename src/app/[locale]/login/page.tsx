"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Globe, GitBranch, ShieldCheck, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { brand } from "@/config/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LOKI_DEFAULT_LOCALE } from "@/lib/constants";

type AuthState = "idle" | "githubLoading" | "emailLoading" | "emailSent" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const t = useTranslations("auth");
  const tMagic = useTranslations("auth.magicLink");
  const search = useSearchParams();
  const [state, setState] = useState<AuthState>("idle");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (search.get("check") === "email") {
      setState("emailSent");
    }
  }, [search]);

  const next = search.get("next") || `/${LOKI_DEFAULT_LOCALE}/app`;

  async function handleGitHubLogin() {
    setState("githubLoading");
    setErrorMsg(null);
    try {
      await signIn("github", { callbackUrl: next });
    } catch {
      setState("error");
      setErrorMsg(t("failed"));
    }
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setErrorMsg(tMagic("invalidEmail"));
      setState("error");
      return;
    }
    setState("emailLoading");
    setErrorMsg(null);
    try {
      const res = await signIn("resend", { email, redirect: false, callbackUrl: next });
      if (res?.error) {
        setState("error");
        setErrorMsg(res.error);
        return;
      }
      setState("emailSent");
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : t("failed"));
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(at 0% 0%, rgba(37,99,235,0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(96,1,209,0.10) 0px, transparent 50%)",
          backgroundColor: "var(--color-background)",
        }}
      />

      <div className="w-full max-w-sm rounded-lg p-10 glass-panel shadow-ambient">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent)]">
            <Globe className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{brand.name}</h1>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-1">{t("tagline")}</p>
          </div>
        </div>

        {state === "emailSent" ? (
          <div className="rounded p-4 bg-[color-mix(in_srgb,var(--color-success-container)_25%,transparent)] text-center">
            <CheckCircle2 className="h-8 w-8 mx-auto text-[var(--color-success)]" />
            <p className="mt-3 text-sm font-medium">{tMagic("sentTitle")}</p>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              {email ? tMagic("sentBody", { email }) : tMagic("sentBodyNoEmail")}
            </p>
            <button
              type="button"
              className="mt-4 text-xs text-[var(--color-primary)] hover:underline"
              onClick={() => {
                setState("idle");
                setEmail("");
              }}
            >
              {tMagic("useDifferent")}
            </button>
          </div>
        ) : (
          <>
            {state === "error" && errorMsg && (
              <div className="mb-4 rounded px-3 py-2 bg-[var(--color-destructive-container)] text-xs text-[var(--color-destructive)]">
                {errorMsg}
              </div>
            )}

            <Button
              className="w-full gap-2 mb-4"
              onClick={handleGitHubLogin}
              disabled={state === "githubLoading" || state === "emailLoading"}
            >
              {state === "githubLoading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GitBranch className="h-4 w-4" />
              )}
              {state === "githubLoading" ? t("signingIn") : t("continueWithGitHub")}
            </Button>

            <div className="my-4 flex items-center gap-3 text-[10px] text-[var(--color-muted-foreground)]">
              <span className="flex-1 h-px bg-[color-mix(in_srgb,var(--color-outline-variant)_25%,transparent)]" />
              <span className="uppercase tracking-wider">{tMagic("or")}</span>
              <span className="flex-1 h-px bg-[color-mix(in_srgb,var(--color-outline-variant)_25%,transparent)]" />
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={tMagic("emailPlaceholder")}
                disabled={state === "emailLoading"}
                aria-label={tMagic("emailPlaceholder")}
              />
              <Button
                type="submit"
                variant="secondary"
                className="w-full gap-2"
                disabled={state === "emailLoading" || !email}
              >
                {state === "emailLoading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                {state === "emailLoading" ? tMagic("sending") : tMagic("send")}
              </Button>
            </form>

            <div className="mt-5 flex items-start gap-2 text-xs text-[var(--color-muted-foreground)]">
              <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-[var(--color-primary)]" />
              <p className="leading-relaxed">{t("disclaimer")}</p>
            </div>
          </>
        )}
      </div>

      <p className="absolute bottom-6 text-xs text-[var(--color-muted-foreground)]">
        Engineered for global scale
      </p>
    </div>
  );
}
