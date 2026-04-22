"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Boxes,
  CircleUserRound,
  FolderTree,
  LogOut,
  PencilLine,
  Repeat2,
  Tag,
  UserRoundSearch,
} from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { LabeledField } from "@/components/labeled-field";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/components/ui/toast";
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
    label: "Catégories",
    icon: FolderTree,
  },
];

export function AppSidebar({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { authEnabled, updateProfile, user, signOut } = useAuth();
  const { toast } = useToast();
  const [viewInfoOpen, setViewInfoOpen] = useState(false);
  const [editInfoOpen, setEditInfoOpen] = useState(false);
  const [fullName, setFullName] = useState(getUserDisplayName(user));

  const displayName = useMemo(() => getUserDisplayName(user), [user]);
  const email = user?.email ?? "Mode démo local";
  const provider = user?.app_metadata.provider ?? "démo";

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const { error } = await updateProfile(fullName);

    if (error) {
      toast({
        title: "Modification impossible",
        description: error,
        variant: "error",
      });
      return;
    }

    toast({
      title: "Profil mis à jour",
      description: "Le nom affiché a été actualisé sur la session.",
      variant: "success",
    });
    setEditInfoOpen(false);
  }

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
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-white/55">AS INVENTORY</p>
          </div>
          <Popover>
            <PopoverTrigger
              className="flex w-full items-center gap-3 rounded-[20px] border border-white/10 bg-white/10 px-3 py-2 text-left transition hover:bg-white/15"
              aria-label="Ouvrir la gestion du compte"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/12 text-white">
                <CircleUserRound className="h-5 w-5" />
              </div>
              <span className="truncate text-sm font-medium text-white">{displayName}</span>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              sideOffset={14}
              className="w-[320px] border-white/10 bg-[#121212] p-3 text-white"
            >
              <div className="rounded-[22px] bg-white/5 p-4">
                <p className="text-sm font-medium text-white">{displayName}</p>
                <p className="mt-1 text-sm text-white/60">{email}</p>
              </div>
              <div className="mt-3 space-y-2">
                <AccountActionButton
                  icon={UserRoundSearch}
                  label="Voir mes infos"
                  onClick={() => {
                    setViewInfoOpen(true);
                  }}
                />
                <AccountActionButton
                  icon={PencilLine}
                  label="Modifier mes infos"
                  disabled={!authEnabled}
                  onClick={() => {
                    setFullName(displayName);
                    setEditInfoOpen(true);
                  }}
                />
                <AccountActionButton
                  icon={LogOut}
                  label="Se déconnecter"
                  disabled={!authEnabled}
                  onClick={handleSignOut}
                />
              </div>
            </PopoverContent>
          </Popover>
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

      <Dialog open={viewInfoOpen} onOpenChange={setViewInfoOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div>
              <DialogTitle>Mes informations</DialogTitle>
              <DialogDescription>
                Les données utiles pour identifier la session active.
              </DialogDescription>
            </div>
            <DialogCloseButton onClick={() => setViewInfoOpen(false)} />
          </DialogHeader>
          <DialogBody className="grid gap-4 sm:grid-cols-2">
            <AccountInfoTile label="Nom affiché" value={displayName} />
            <AccountInfoTile label="Email" value={email} />
            <AccountInfoTile label="Provider" value={provider} />
            <AccountInfoTile label="Identifiant" value={user?.id ?? "session-demo"} />
          </DialogBody>
        </DialogContent>
      </Dialog>

      <Dialog open={editInfoOpen} onOpenChange={setEditInfoOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div>
              <DialogTitle>Modifier mes informations</DialogTitle>
              <DialogDescription>
                Mets à jour le nom visible dans l’interface du compte.
              </DialogDescription>
            </div>
            <DialogCloseButton onClick={() => setEditInfoOpen(false)} />
          </DialogHeader>
          <DialogBody>
            <form className="space-y-4" onSubmit={handleProfileSubmit}>
              <LabeledField label="Nom affiché">
                <Input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Ex: Asuka Admin"
                />
              </LabeledField>
              <LabeledField label="Email">
                <Input value={email} disabled />
              </LabeledField>
              <div className="flex flex-wrap justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setEditInfoOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={!authEnabled}>
                  Enregistrer
                </Button>
              </div>
            </form>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getUserDisplayName(user: ReturnType<typeof useAuth>["user"]) {
  const metadataName =
    typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user?.user_metadata?.name === "string"
        ? user.user_metadata.name
        : null;

  if (metadataName?.trim()) {
    return metadataName.trim();
  }

  if (user?.email) {
    return user.email.split("@")[0];
  }

  return "Utilisateur";
}

function AccountActionButton({
  icon: Icon,
  label,
  disabled,
  onClick,
}: {
  icon: typeof CircleUserRound;
  label: string;
  disabled?: boolean;
  onClick: () => void | Promise<void>;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="flex w-full items-center gap-3 rounded-[20px] px-3 py-3 text-left text-sm text-white transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-45"
      onClick={() => {
        void onClick();
      }}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-white">
        <Icon className="h-4 w-4" />
      </div>
      <span>{label}</span>
    </button>
  );
}

function AccountInfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-border bg-muted/35 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <p className="mt-3 break-all text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
