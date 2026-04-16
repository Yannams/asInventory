import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(255,122,0,0.32),_transparent_28%),linear-gradient(135deg,_#0a0a0a_0%,_#101010_100%)] p-8 text-white shadow-soft sm:p-10">
          <Badge variant="warning" className="w-fit">
            Connexion
          </Badge>
          <div className="mt-6 space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-white/55">
              AS WORLD TECH
            </p>
            <h1 className="max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
              Unifier le stock de ASUKA SPIRIT et de Docteur Asuka.
            </h1>
            <p className="max-w-xl text-base leading-7 text-white/72">
              Les produits finis de la marque ASUKA SPIRIT et les pieces SAV de
              Docteur Asuka restent traces dans une meme interface claire.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/60">Validation distante</p>
              <p className="mt-2 text-xl font-medium">Demandes SAV sans papier</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/60">Deux marques, une vue</p>
              <p className="mt-2 text-xl font-medium">Produits et reparation</p>
            </div>
          </div>
        </section>

        <Card className="border-border/80 bg-white/92">
          <CardHeader>
            <Badge variant="neutral" className="mb-3 w-fit">
              Session metier
            </Badge>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Acces au stock
            </CardTitle>
            <CardDescription>
              Ecran de connexion V1 pret pour un branchement Supabase Auth.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Email</span>
              <Input type="email" placeholder="loic@asworldtech.local" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Mot de passe</span>
              <Input type="password" placeholder="********" />
            </label>
            <Link href="/dashboard" className={cn(buttonVariants(), "w-full")}>
              Se connecter
            </Link>
            <p className="text-sm leading-6 text-muted-foreground">
              La connexion reste simple en V1, mais l intention est claire :
              attribuer chaque action de stock a une personne identifiee.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
