"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FilterMenuProps = {
  children: ReactNode;
  activeCount?: number;
  onClear?: () => void;
  title?: string;
  className?: string;
  triggerClassName?: string;
};

export function FilterMenu({
  children,
  activeCount = 0,
  onClear,
  title = "Filtres",
  className,
  triggerClassName,
}: FilterMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative w-full min-w-0 lg:flex-1", className)}>
      <Button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          "h-14 w-full min-w-0 gap-2 rounded-[20px] px-5 lg:justify-center",
          triggerClassName
        )}
        onClick={() => setOpen((current) => !current)}
      >
        <SlidersHorizontal className="h-4 w-4" />
        <span>Filtres</span>
        {activeCount > 0 ? (
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold text-white">
            {activeCount}
          </span>
        ) : null}
        <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
      </Button>

      {open ? (
        <div
          id={panelId}
          className="absolute right-0 top-[calc(100%+12px)] z-30 w-[min(92vw,360px)] rounded-[24px] border border-border bg-white p-5 shadow-[0_22px_60px_rgba(0,0,0,0.14)]"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground">
                Ajustez les criteres affiches dans la liste.
              </p>
            </div>
            {onClear ? (
              <button
                type="button"
                className="text-xs font-medium text-primary transition hover:text-primary/80"
                onClick={() => {
                  onClear();
                  setOpen(false);
                }}
              >
                Reinitialiser
              </button>
            ) : null}
          </div>
          <div className="space-y-4">{children}</div>
        </div>
      ) : null}
    </div>
  );
}
