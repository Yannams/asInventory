"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

type PopoverContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const PopoverContext = createContext<PopoverContextValue | null>(null);

export function Popover({
  children,
  open: controlledOpen,
  onOpenChange,
}: {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = (nextOpen: boolean) => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const value = useMemo(() => ({ open, setOpen }), [open]);

  return (
    <PopoverContext.Provider value={value}>
      <div ref={rootRef} className="relative">
        {children}
      </div>
    </PopoverContext.Provider>
  );
}

export function PopoverTrigger({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const context = usePopoverContext();

  return (
    <button
      type="button"
      className={className}
      onClick={() => context.setOpen(!context.open)}
      {...props}
    >
      {children}
    </button>
  );
}

export function PopoverContent({
  children,
  className,
  align = "end",
  sideOffset = 12,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  align?: "start" | "end";
  sideOffset?: number;
}) {
  const context = usePopoverContext();

  if (!context.open) {
    return null;
  }

  return (
    <div
      style={{ marginTop: sideOffset }}
      className={cn(
        "absolute top-full z-50 min-w-[280px] rounded-[28px] border border-border bg-white p-3 shadow-[0_24px_80px_rgba(0,0,0,0.18)]",
        align === "end" ? "right-0" : "left-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function usePopoverContext() {
  const context = useContext(PopoverContext);

  if (!context) {
    throw new Error("Popover components must be used within Popover");
  }

  return context;
}
