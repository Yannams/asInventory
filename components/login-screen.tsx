"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function LoginScreen({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const { authEnabled, isLoading, session, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && session) {
      router.replace(nextPath);
    }
  }, [isLoading, nextPath, router, session]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("Email et mot de passe sont obligatoires.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await signIn(email.trim(), password);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    router.replace(nextPath);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(255,122,0,0.32),_transparent_28%),linear-gradient(135deg,_#0a0a0a_0%,_#101010_100%)] p-8 text-white shadow-soft sm:p-10">
          <Badge variant="warning" className="w-fit">
            Connexion
          </Badge>
          <div className="mt-6 space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-white/55">ASUKA INVENTORY</p>
            <h1 className="max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
              Gerer le stock avec une session Supabase propre et tracable.
            </h1>
            <p className="max-w-xl text-base leading-7 text-white/72">
              Le MVP est recentre sur l essentiel: creer les articles, enregistrer les
              entrees, enregistrer les sorties et surveiller l etat du stock.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/60">Supabase Auth</p>
              <p className="mt-2 text-xl font-medium">Chaque action est attribuee</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/60">MVP recentre</p>
              <p className="mt-2 text-xl font-medium">Articles, entrees, sorties, stock</p>
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
              {authEnabled
                ? "Connectez-vous avec votre utilisateur Supabase Auth."
                : "Supabase n est pas configure. L application reste visible en mode demo."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {authEnabled ? (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Email</span>
                  <Input
                    type="email"
                    value={email}
                    placeholder="loic@asworldtech.com"
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Mot de passe</span>
                  <Input
                    type="password"
                    value={password}
                    placeholder="********"
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </label>
                {error ? (
                  <div className="rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}
                <Button type="submit" className="w-full" disabled={isSubmitting || isLoading}>
                  {isSubmitting ? "Connexion..." : "Se connecter"}
                </Button>
                <p className="text-sm leading-6 text-muted-foreground">
                  Utilise les variables `NEXT_PUBLIC_SUPABASE_URL` et
                  `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
                </p>
              </form>
            ) : (
              <>
                <div className="rounded-[20px] border border-border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
                  Configure `.env.local` avec les variables Supabase pour activer l authentification.
                  En attendant, tu peux ouvrir l app en mode demo pour valider l interface.
                </div>
                <Link href="/dashboard" className={cn(buttonVariants(), "w-full")}>
                  Ouvrir le mode demo
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
