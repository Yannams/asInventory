"use client";

import {
  useEffect,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
};

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onOpenChange, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fermer"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-10 w-full max-w-2xl">{children}</div>
    </div>
  );
}

export function DialogContent({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        "rounded-[30px] border border-border/80 bg-white p-6 shadow-[0_30px_120px_rgba(0,0,0,0.18)] sm:p-7",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DialogHeader({
  className,
  children,
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-start justify-between gap-4", className)}>{children}</div>;
}

export function DialogTitle({
  className,
  children,
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn("text-2xl font-semibold tracking-tight text-foreground", className)}>
      {children}
    </h2>
  );
}

export function DialogDescription({
  className,
  children,
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("mt-2 text-sm leading-6 text-muted-foreground", className)}>{children}</p>
  );
}

export function DialogCloseButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white text-muted-foreground transition hover:text-foreground"
      {...props}
    >
      <X className="h-4 w-4" />
    </button>
  );
}

export function DialogBody({
  className,
  children,
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-6", className)}>{children}</div>;
}

export function DialogFooter({
  className,
  children,
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-6 flex flex-wrap justify-end gap-3", className)}>{children}</div>;
}

export function DialogSubmitButton({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button type="submit" {...props}>
      {children}
    </Button>
  );
}
