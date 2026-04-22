"use client";

import Link from "next/link";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="fr">
      <body className="bg-[#f8f7f4] text-[#111111]">
        <main className="flex min-h-screen items-center justify-center px-6 py-10">
          <div className="w-full max-w-xl rounded-[28px] border border-black/10 bg-white p-8 shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
            <p className="text-xs uppercase tracking-[0.18em] text-black/50">
              ASUKA INVENTORY
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              Une erreur est survenue.
            </h1>
            <p className="mt-3 text-sm leading-7 text-black/65">
              Le projet utilise maintenant un fallback App Router natif pour faciliter le
              diagnostic si une page plante en developpement.
            </p>
            {error.message ? (
              <pre className="mt-5 overflow-x-auto rounded-3xl bg-black px-5 py-4 text-xs leading-6 text-white">
                {error.message}
              </pre>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                onClick={reset}
              >
                Reessayer
              </button>
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-white px-5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
              >
                Retour au dashboard
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
