"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

export type ToastVariant = "default" | "success" | "destructive" | "info";

export interface ToastProps {
  message: string;
  variant?: ToastVariant;
  onClose?: () => void;
  className?: string;
}

const variantStyles: Record<ToastVariant, string> = {
  default:
    "bg-[var(--color-surface-container-highest)] text-[var(--color-foreground)]",
  success:
    "bg-[var(--color-success-container)] text-[var(--color-tertiary)]",
  destructive:
    "bg-[var(--color-destructive-container)] text-[var(--color-destructive)]",
  info:
    "bg-[var(--color-surface-container-high)] text-[var(--color-primary)]",
};

const variantIcons: Record<ToastVariant, React.ReactNode> = {
  default: <Info className="h-4 w-4" />,
  success: <CheckCircle className="h-4 w-4" />,
  destructive: <AlertCircle className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />,
};

export function Toast({ message, variant = "default", onClose, className }: ToastProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded px-4 py-3 text-sm shadow-ambient",
        variantStyles[variant],
        className
      )}
    >
      {variantIcons[variant]}
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="opacity-70 hover:opacity-100 transition-opacity">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
