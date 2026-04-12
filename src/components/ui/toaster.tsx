"use client";

import { ToastContext, useToastState } from "@/lib/use-toast";
import { Toast } from "@/components/ui/toast";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const state = useToastState();

  return (
    <ToastContext.Provider value={state}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80">
        {state.toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            variant={t.variant}
            onClose={() => state.dismiss(t.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
