"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SignOutButtonProps {
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "secondary" | "destructive" | "ghost";
}

export function SignOutButton({ children, className, variant = "secondary" }: SignOutButtonProps) {
  return (
    <Button
      size="sm"
      variant={variant}
      className={cn(className)}
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      {children ?? "Sign out"}
    </Button>
  );
}
