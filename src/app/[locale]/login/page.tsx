"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Globe, GitBranch, ShieldCheck } from "lucide-react";
import { brand } from "@/config/brand";
import { Button } from "@/components/ui/button";

type AuthState = "idle" | "loading" | "error";

export default function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const t = useTranslations("auth");
  const [state, setState] = useState<AuthState>("idle");

  const handleGitHubLogin = async () => {
    setState("loading");
    try {
      await signIn("github", { callbackUrl: `/en/app` });
    } catch {
      setState("error");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      {/* Mesh gradient background */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(at 0% 0%, rgba(37,99,235,0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(96,1,209,0.10) 0px, transparent 50%)",
          backgroundColor: "#131313",
        }}
      />

      {/* Glass panel */}
      <div className="w-full max-w-sm rounded-lg p-10 glass-panel shadow-ambient">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent)]">
            <Globe className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{brand.name}</h1>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
              {t("tagline")}
            </p>
          </div>
        </div>

        {/* Error */}
        {state === "error" && (
          <div className="mb-4 rounded px-3 py-2 bg-[var(--color-destructive-container)] text-xs text-[var(--color-destructive)]">
            {t("failed")}
          </div>
        )}

        {/* GitHub CTA */}
        <Button
          className="w-full gap-2 mb-5"
          onClick={handleGitHubLogin}
          disabled={state === "loading"}
        >
          <GitBranch className="h-4 w-4" />
          {state === "loading" ? t("signingIn") : t("continueWithGitHub")}
        </Button>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 text-xs text-[var(--color-muted-foreground)]">
          <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-[var(--color-primary)]" />
          <p className="leading-relaxed">{t("disclaimer")}</p>
        </div>
      </div>

      <p className="absolute bottom-6 text-xs text-[var(--color-muted-foreground)]">
        Engineered for global scale
      </p>
    </div>
  );
}
