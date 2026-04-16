"use client";

import { useState, type FormEvent, type ReactNode } from "react";

import { useInventory } from "@/components/inventory-provider";
import { PageHeader } from "@/components/page-header";
import { RequestStatusBadge, StockHealthBadge } from "@/components/status-badge";
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
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function RequestsScreen() {
  const { articles, requests, createRequest } = useInventory();
  const [articleId, setArticleId] = useState(articles[0]?.id ?? "");
  const [quantity, setQuantity] = useState("2");
  const [requester, setRequester] = useState("Brice Houngbe");
  const [reason, setReason] = useState("Preparation d une reparation client");
  const [jobReference, setJobReference] = useState("SAV-COT-120");
  const [note, setNote] = useState("Besoin confirme avant 15h");

  const selectedArticle = articles.find((article) => article.id === articleId);
  const quantityNumber = Number(quantity) || 0;
  const projected = Math.max(0, (selectedArticle?.availableQty ?? 0) - quantityNumber);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!articleId || quantityNumber <= 0 || !requester.trim() || !reason.trim()) {
      return;
    }

    createRequest({
      articleId,
      quantity: quantityNumber,
      requester: requester.trim(),
      reason: reason.trim(),
      jobReference: jobReference.trim(),
      note: note.trim(),
    });

    setQuantity("1");
    setNote("Demande transmise pour validation");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Demandes de sortie"
        title="Remplacer la fiche papier par une demande claire et validable."
        description="Le technicien peut formuler son besoin sans bloquer le workflow, et le gestionnaire garde une vue lisible sur ce qui partira du stock."
      />

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <Badge variant="neutral" className="mb-3 w-fit">
              Demande guidee
            </Badge>
            <CardTitle className="text-2xl">Nouvelle demande</CardTitle>
            <CardDescription>
              Motif, chantier et quantite sont visibles sans noyer l utilisateur
              dans des champs inutiles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Field label="Article demande">
                <Select value={articleId} onChange={(event) => setArticleId(event.target.value)}>
                  {articles.map((article) => (
                    <option key={article.id} value={article.id}>
                      {article.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Quantite">
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                  />
                </Field>
                <Field label="Demandeur">
                  <Input
                    value={requester}
                    onChange={(event) => setRequester(event.target.value)}
                  />
                </Field>
              </div>
              <Field label="Motif">
                <Input value={reason} onChange={(event) => setReason(event.target.value)} />
              </Field>
              <Field label="Ticket SAV, showroom ou besoin interne">
                <Input
                  value={jobReference}
                  onChange={(event) => setJobReference(event.target.value)}
                />
              </Field>
              <Field label="Remarque">
                <Textarea value={note} onChange={(event) => setNote(event.target.value)} />
              </Field>
              <button type="submit" className={cn(buttonVariants(), "w-full")}>
                Soumettre la demande
              </button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-black text-white">
            <CardHeader>
              <Badge variant="warning" className="mb-3 w-fit">
                Lecture stock
              </Badge>
              <CardTitle className="text-2xl text-white">Disponibilite avant envoi</CardTitle>
              <CardDescription className="text-white/65">
                Le technicien voit si sa demande risque de tendre le stock avant
                meme la validation.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <ImpactTile label="Disponible" value={`${selectedArticle?.availableQty ?? 0}`} />
              <ImpactTile label="Demande" value={`${quantityNumber}`} />
              <ImpactTile label="Reste si validee" value={`${projected}`} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Badge variant="neutral" className="mb-3 w-fit">
                Historique court
              </Badge>
              <CardTitle className="text-2xl">Demandes recentes</CardTitle>
              <CardDescription>
                Les statuts restent visibles pour suivre ce qui attend, ce qui
                est accepte et ce qui a ete refuse.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {requests.slice(0, 6).map((request) => {
                const article = articles.find((item) => item.id === request.articleId);

                return (
                  <div
                    key={request.id}
                    className="rounded-[24px] border border-border bg-muted/35 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <RequestStatusBadge status={request.status} />
                          {article ? <StockHealthBadge article={article} /> : null}
                        </div>
                        <p className="font-medium">{request.requester}</p>
                        <p className="text-sm text-muted-foreground">
                          {article?.name} · {request.quantity} {article?.unit} ·{" "}
                          {request.jobReference}
                        </p>
                        <p className="text-sm text-muted-foreground">{request.reason}</p>
                        {request.reviewComment ? (
                          <p className="text-sm text-foreground">
                            Commentaire : {request.reviewComment}
                          </p>
                        ) : null}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(request.requestedAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

function ImpactTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <p className="text-sm text-white/60">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
