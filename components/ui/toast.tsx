"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";

import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastItem = ToastInput & {
  id: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  toast: (input: ToastInput) => void;
};

const TOAST_DURATION_MS = 4200;
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutIds = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((toastId: string) => {
    const timeoutId = timeoutIds.current[toastId];

    if (timeoutId) {
      clearTimeout(timeoutId);
      delete timeoutIds.current[toastId];
    }

    setToasts((current) => current.filter((toast) => toast.id !== toastId));
  }, []);

  const toast = useCallback(
    ({ title, description, variant = "info" }: ToastInput) => {
      const id = `toast-${Math.random().toString(36).slice(2, 10)}`;

      setToasts((current) => [...current, { id, title, description, variant }]);
      timeoutIds.current[id] = setTimeout(() => dismiss(id), TOAST_DURATION_MS);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[110] flex flex-col gap-3 px-4 sm:items-end">
        {toasts.map((item) => {
          const Icon =
            item.variant === "success"
              ? CheckCircle2
              : item.variant === "error"
                ? CircleAlert
                : Info;

          return (
            <div
              key={item.id}
              className={cn(
                "pointer-events-auto w-full max-w-sm rounded-[24px] border px-4 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.15)] backdrop-blur",
                item.variant === "success" && "border-emerald-200 bg-white text-foreground",
                item.variant === "error" && "border-red-200 bg-red-50 text-red-900",
                item.variant === "info" && "border-border bg-white text-foreground"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                    item.variant === "success" && "bg-emerald-100 text-emerald-700",
                    item.variant === "error" && "bg-red-100 text-red-700",
                    item.variant === "info" && "bg-primary/10 text-primary"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.title}</p>
                  {item.description ? (
                    <p
                      className={cn(
                        "mt-1 text-sm leading-6",
                        item.variant === "error" ? "text-red-800" : "text-muted-foreground"
                      )}
                    >
                      {item.description}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  aria-label="Fermer la notification"
                  className="rounded-full p-1 text-muted-foreground transition hover:bg-black/5 hover:text-foreground"
                  onClick={() => dismiss(item.id)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
