"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/auth-provider";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { authEnabled, isLoading, session } = useAuth();

  useEffect(() => {
    if (!authEnabled || isLoading || session) {
      return;
    }

    router.replace(`/login?next=${encodeURIComponent(pathname ?? "/dashboard")}`);
  }, [authEnabled, isLoading, pathname, router, session]);

  if (!authEnabled) {
    return children;
  }

  if (isLoading || !session) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Verification de session</CardTitle>
            <CardDescription>
              On verifie votre connexion Supabase avant d ouvrir le stock.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return children;
}
