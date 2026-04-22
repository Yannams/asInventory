"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
      <Card className="w-full max-w-md border-border/80 bg-white/95">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Connexion
          </CardTitle>
          <CardDescription>
            {authEnabled
              ? "Connectez-vous pour acc\u00E9der au stock."
              : "Supabase n\u2019est pas configur\u00E9."}
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
                  placeholder="prenom.nom@asworld.tech"
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
            </form>
          ) : (
            <div></div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
