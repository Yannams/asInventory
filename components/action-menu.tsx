"use client";

import Link from "next/link";
import { createContext, useContext, useState, type ReactNode } from "react";
import { MoreHorizontal, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type ActionMenuContextValue = {
  closeMenu: () => void;
};

const ActionMenuContext = createContext<ActionMenuContextValue | null>(null);

export function ActionMenu({
  children,
  label = "Ouvrir les actions",
  align = "end",
}: {
  children: ReactNode;
  label?: string;
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);

  return (
    <ActionMenuContext.Provider value={{ closeMenu: () => setOpen(false) }}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          aria-label={label}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-foreground transition hover:border-primary hover:text-primary"
        >
          <MoreHorizontal className="h-4 w-4" />
        </PopoverTrigger>
        <PopoverContent
          align={align}
          sideOffset={10}
          className="w-[240px] rounded-[24px] border-border bg-white p-2"
        >
          <div className="space-y-1">{children}</div>
        </PopoverContent>
      </Popover>
    </ActionMenuContext.Provider>
  );
}

export function ActionMenuItem({
  icon: Icon,
  children,
  onSelect,
  disabled,
  destructive = false,
}: {
  icon?: LucideIcon;
  children: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  const context = useActionMenuContext();

  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-3 rounded-[18px] px-3 py-2.5 text-left text-sm transition",
        destructive
          ? "text-red-600 hover:bg-red-50"
          : "text-foreground hover:bg-black/[0.04]",
        "disabled:cursor-not-allowed disabled:opacity-45"
      )}
      onClick={() => {
        onSelect();
        context.closeMenu();
      }}
    >
      {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
      <span>{children}</span>
    </button>
  );
}

export function ActionMenuLink({
  icon: Icon,
  href,
  children,
  destructive = false,
}: {
  icon?: LucideIcon;
  href: string;
  children: ReactNode;
  destructive?: boolean;
}) {
  const context = useActionMenuContext();

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-[18px] px-3 py-2.5 text-sm transition",
        destructive ? "text-red-600 hover:bg-red-50" : "text-foreground hover:bg-black/[0.04]"
      )}
      onClick={() => context.closeMenu()}
    >
      {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
      <span>{children}</span>
    </Link>
  );
}

export function ActionMenuSeparator() {
  return <div className="my-1 border-t border-border/80" />;
}

export function ActionMenuTriggerButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  const context = useActionMenuContext();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => {
        onClick();
        context.closeMenu();
      }}
    >
      {children}
    </Button>
  );
}

function useActionMenuContext() {
  const context = useContext(ActionMenuContext);

  if (!context) {
    throw new Error("Action menu components must be used within ActionMenu.");
  }

  return context;
}
