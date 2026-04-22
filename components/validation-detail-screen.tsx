"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, CheckCheck, X } from "lucide-react";

import { useInventory } from "@/components/inventory-provider";
import { PageHeader } from "@/components/page-header";
import { StockHealthBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { RequestStatus } from "@/lib/types";

export function ValidationDetailScreen({ requestId }: { requestId: string }) {
  const { articles, requests, approveRequest, rejectRequest } = useInventory();
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const request = useMemo(
    () => requests.find((item) => item.id === requestId) ?? null,
    [requestId, requests]
  );

  if (!request) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-4 p-6">
          <p className="text-lg font-medium">Validation introuvable</p>
          <p className="text-sm text-muted-foreground">
            Cette demande n existe pas ou n est plus disponible dans la session actuelle.
          </p>
          <Link href="/validations" className={buttonVariants({ variant: "outline" })}>
            Retour aux validations
          </Link>
        </CardContent>
      </Card>
    );
  }

  const currentRequest = request;
  const article = articles.find((item) => item.id === currentRequest.articleId) ?? null;
  const remaining = Math.max(0, (article?.availableQty ?? 0) - currentRequest.quantity);

  function handleReject() {
    const success = rejectRequest(currentRequest.id, comment);

    if (!success) {
      setError("Un commentaire est obligatoire pour refuser une demande.");
      return;
    }

    setError("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/validations"
        backLabel="Retour aux validations"
        eyebrow="Detail de validation"
        title={currentRequest.id}
        description="La demande est traitee sur une page dediee pour garder la table des validations compacte et facile a parcourir."
      />

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card>
          <CardHeader>
            <Badge variant="neutral" className="mb-3 w-fit">
              Informations de demande
            </Badge>
            <CardTitle className="text-2xl">Contexte complet</CardTitle>
            <CardDescription>
              Le gestionnaire voit qui demande, quoi, pourquoi et avec quel impact sur le stock.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <DetailTile label="Demandeur" value={currentRequest.requester} />
            <DetailTile label="Reference" value={currentRequest.jobReference} />
            <DetailTile label="Article" value={article?.name ?? "Article inconnu"} />
            <DetailTile
              label="Quantite demandee"
              value={`${currentRequest.quantity} ${article?.unit ?? ""}`}
            />
            <DetailTile
              label="Disponible"
              value={`${article?.availableQty ?? 0} ${article?.unit ?? ""}`}
            />
            <DetailTile
              label="Reste si validee"
              value={`${remaining} ${article?.unit ?? ""}`}
            />
            <div className="rounded-[24px] border border-border p-4 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Motif
              </p>
              <p className="mt-3 text-sm leading-7 text-foreground">{currentRequest.reason}</p>
            </div>
            <div className="rounded-[24px] border border-border p-4 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Stock
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {article ? <StockHealthBadge article={article} /> : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black text-white">
          <CardHeader>
            <Badge variant="warning" className="mb-3 w-fit">
              Decision
            </Badge>
            <CardTitle className="text-2xl text-white">Action de validation</CardTitle>
            <CardDescription className="text-white/65">
              Le refus exige un commentaire. Une validation enregistre la sortie dans l historique global.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/60">Statut actuel</p>
              <p className={cn("mt-2 text-xl font-semibold", getStatusTextClass(currentRequest.status, true))}>
                {getStatusText(currentRequest.status)}
              </p>
              {currentRequest.reviewComment ? (
                <p className="mt-3 text-sm leading-6 text-white/70">
                  {currentRequest.reviewComment}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">
                Commentaire si refus
              </label>
              <Textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Expliquer le refus pour garder une trace claire."
                className="min-h-28 border-white/10 bg-white/5 text-white placeholder:text-white/35"
              />
              {error ? <p className="text-sm text-primary">{error}</p> : null}
            </div>

            {currentRequest.status === "pending" ? (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={cn(buttonVariants(), "bg-white text-black hover:bg-white/90")}
                  onClick={() => approveRequest(currentRequest.id)}
                >
                  <CheckCheck className="h-4 w-4" />
                  Valider
                </button>
                <button
                  type="button"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  )}
                  onClick={handleReject}
                >
                  <X className="h-4 w-4" />
                  Refuser
                </button>
              </div>
            ) : (
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/70">
                Cette demande a deja ete traitee et reste consultable pour conserver une trace claire.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function DetailTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-border p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
      <p className="mt-3 font-medium">{value}</p>
    </div>
  );
}

function getStatusText(status: RequestStatus) {
  if (status === "pending") {
    return "En attente";
  }

  if (status === "approved") {
    return "Validee";
  }

  return "Refusee";
}

function getStatusTextClass(status: RequestStatus, dark = false) {
  if (status === "pending") {
    return "text-primary";
  }

  if (status === "approved") {
    return dark ? "text-emerald-300" : "text-blue-600";
  }

  return dark ? "text-white/85" : "text-zinc-500";
}
