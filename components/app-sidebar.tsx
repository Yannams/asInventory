"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  ArrowUpFromLine,
  BarChart3,
  Boxes,
  FolderTree,
  LogOut,
  PackagePlus,
  Repeat2,
  Tag,
} from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  {
    href: "/dashboard",
    label: "Tableau de bord",
    icon: BarChart3,
  },
  {
    href: "/stock/articles",
    label: "Articles",
    icon: Boxes,
  },
  {
    href: "/stock/entries",
    label: "Entrees",
    icon: PackagePlus,
  },
  {
    href: "/stock/outputs",
    label: "Sorties",
    icon: ArrowUpFromLine,
  },
  {
    href: "/stock/movements",
    label: "Mouvements",
    icon: Repeat2,
  },
  {
    href: "/configuration/brands",
    label: "Marques",
    icon: Tag,
  },
  {
    href: "/configuration/categories",
    label: "Categories",
    icon: FolderTree,
  },
];

export function AppSidebar({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { authEnabled, user, signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <div
      className={cn(
        "rounded-[32px] border border-border bg-white/92 shadow-soft",
        compact ? "p-4" : "p-5"
      )}
    >
      <div className="rounded-[26px] bg-[radial-gradient(circle_at_top_left,_rgba(255,122,0,0.18),_transparent_30%),linear-gradient(145deg,_#111111_0%,_#1b1b1b_100%)] p-5 text-white">
        <Badge variant="warning" className="w-fit">
          MVP stock
        </Badge>
        <div className="mt-4 space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-white/55">ASUKA INVENTORY</p>
          <p className="text-2xl font-semibold">Entrees, sorties et etat du stock.</p>
          <p className="text-sm leading-6 text-white/70">
            Version recentree sur le pilotage du stock avec Supabase.
          </p>
        </div>
      </div>

      <nav className="mt-5 space-y-2">
        {navigation.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || (href !== "/dashboard" && pathname?.startsWith(`${href}/`));

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                buttonVariants({ variant: active ? "default" : "ghost" }),
                "w-full justify-start rounded-[20px] px-4",
                active && "shadow-none"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-5 rounded-[24px] border border-border bg-muted/40 p-4">
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Session</p>
        <p className="mt-3 text-sm font-medium text-foreground">
          {authEnabled ? user?.email ?? "Utilisateur connecte" : "Mode demo local"}
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {authEnabled
            ? "Chaque entree et sortie est attribuee a la session Supabase active."
            : "Supabase Auth n est pas configure. L application reste visible en mode demo."}
        </p>
      </div>

      {authEnabled ? (
        <Button
          type="button"
          variant="outline"
          className="mt-5 w-full justify-center"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Se deconnecter
        </Button>
      ) : null}
    </div>
  );
}
