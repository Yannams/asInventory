"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ClipboardCheck,
  LayoutDashboard,
  LogIn,
  PackagePlus,
  Repeat2,
  ShieldCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Pilotage",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/validations", label: "Validations", icon: ClipboardCheck },
      { href: "/reports", label: "Rapports", icon: BarChart3 },
    ],
  },
  {
    label: "Stock",
    items: [
      { href: "/stock/articles", label: "Articles", icon: Boxes },
      { href: "/stock/entries", label: "Entrees", icon: PackagePlus },
      { href: "/stock/requests", label: "Demandes de sortie", icon: ShieldCheck },
      { href: "/stock/movements", label: "Mouvements", icon: Repeat2 },
    ],
  },
];

function isActivePath(pathname: string, href: string) {
  if (pathname === href) {
    return true;
  }

  return pathname.startsWith(`${href}/`);
}

type AppSidebarProps = {
  compact?: boolean;
};

export function AppSidebar({ compact = false }: AppSidebarProps) {
  const pathname = usePathname() ?? "";

  return (
    <div className={cn("flex flex-col gap-6", compact && "gap-4")}>
      <div className="rounded-[28px] bg-black p-6 text-white shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-white/55">
          AS WORLD TECH
        </p>
        <div className="mt-4 space-y-2">
          <h2 className="text-2xl font-semibold">Stock multi-marques</h2>
          <p className="text-sm leading-6 text-white/68">
            ASUKA SPIRIT pour les appareils, Docteur Asuka pour le SAV et la reparation.
          </p>
        </div>
        <Link
          href="/login"
          className="mt-5 inline-flex items-center gap-2 text-sm text-white/80 transition hover:text-white"
        >
          <LogIn className="h-4 w-4" />
          Changer de session
        </Link>
      </div>

      {navGroups.map((group) => (
        <div key={group.label} className="space-y-3">
          <p className="px-2 text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
            {group.label}
          </p>
          <div className="space-y-2">
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = isActivePath(pathname, href);

              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center justify-between rounded-[22px] border px-4 py-3 text-sm transition",
                    active
                      ? "border-primary/30 bg-primary/10 text-foreground"
                      : "border-transparent bg-white/70 text-muted-foreground hover:border-border hover:text-foreground"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-2xl",
                        active ? "bg-primary text-white" : "bg-black/[0.04] text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="font-medium">{label}</span>
                  </span>
                  {active ? <span className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
