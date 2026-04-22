"use client";

import Link from "next/link";

type WorkspaceErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function WorkspaceError({ error, reset }: WorkspaceErrorProps) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl rounded-[30px] border border-border/80 bg-white p-8 shadow-soft">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Espace de travail
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
          Cette page a rencontre une erreur.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
          Si tu vois encore une erreur Webpack apres redemarrage, on aura maintenant un ecran plus
          propre pour isoler la vraie cause au lieu d un fallback legacy.
        </p>
        {error.message ? (
          <pre className="mt-5 overflow-x-auto rounded-[24px] bg-black px-5 py-4 text-xs leading-6 text-white">
            {error.message}
          </pre>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            onClick={reset}
          >
            Recharger la page
          </button>
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-white px-5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
          >
            Aller au dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
