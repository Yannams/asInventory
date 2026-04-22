"use client";

import Link from "next/link";
import { Eye, History, PackageSearch, Repeat2 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { ConditionBadge, MovementTypeBadge, StockHealthBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useInventory } from "@/components/inventory-provider";
import { formatDateTime } from "@/lib/format";
import { getActiveMovements, getMovementStockSnapshot } from "@/lib/stock";
import type { Movement } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MovementDetailScreen({ movementId }: { movementId: string }) {
  const { articles, movements } = useInventory();
  const movement = movements.find((item) => item.id === movementId);

  if (!movement) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-4 p-6">
          <p className="text-lg font-medium">Mouvement introuvable</p>
          <p className="text-sm text-muted-foreground">
            Ce mouvement n’existe pas ou n’est plus disponible dans l’historique.
          </p>
          <Link href="/stock/movements" className={buttonVariants({ variant: "outline" })}>
            Retour aux mouvements
          </Link>
        </CardContent>
      </Card>
    );
  }

  const article = articles.find((item) => item.id === movement.articleId);
  const movementById = new Map(movements.map((item) => [item.id, item]));
  const replacement = movement.replacedByMovementId
    ? movementById.get(movement.replacedByMovementId)
    : null;
  const replacedMovement = movement.replacesMovementId
    ? movementById.get(movement.replacesMovementId)
    : null;
  const stockSnapshot = getMovementStockSnapshot(movement.id, movements);
  const articleMovements = [...movements]
    .filter((item) => item.articleId === movement.articleId)
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
  const activeArticleMovements = getActiveMovements(articleMovements);
  const movementHistory = buildMovementHistory(movement, movementById);

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/stock/movements"
        backLabel="Retour aux mouvements"
        eyebrow="Détail mouvement"
        title={`${movement.type === "entry" ? "Entrée" : "Sortie"} - ${article?.name ?? "Article inconnu"}`}
        description="Cette vue concentre l’impact stock, les informations de traçabilité et l’historique de modification du mouvement."
        actions={
          <Link
            href={`/stock/articles/${movement.articleId}`}
            className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
          >
            <Eye className="h-4 w-4" />
            Voir l’article
          </Link>
        }
      />

      <section className="grid gap-4 lg:grid-cols-4">
        <InfoCard label="Article" value={article?.reference ?? "Référence inconnue"} />
        <InfoCard
          label={movement.type === "entry" ? "Quantité reçue" : "Quantité sortie"}
          value={`${movement.type === "output" ? "-" : "+"}${movement.quantity} ${article?.unit ?? ""}`}
        />
        <InfoCard
          label={movement.type === "output" ? "Reste après sortie" : "Stock après entrée"}
          value={
            stockSnapshot
              ? `${stockSnapshot.stockAfter} ${article?.unit ?? ""}`
              : "Historique archivé"
          }
        />
        <InfoCard
          label="Stock actuel"
          value={article ? `${article.availableQty} ${article.unit}` : "Article absent"}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <Card>
          <CardHeader>
            <Badge variant="neutral" className="mb-3 w-fit">
              Traceabilité
            </Badge>
            <CardTitle className="text-2xl">Lecture rapide</CardTitle>
            <CardDescription>
              Les données principales pour comprendre ce mouvement sans recharger le tableau.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <DetailTile label="Acteur" value={movement.actor} />
            <DetailTile label="Date" value={formatDateTime(movement.date)} />
            <div className="rounded-[24px] border border-border p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Type</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <MovementTypeBadge type={movement.type} />
                {movement.condition ? <ConditionBadge condition={movement.condition} /> : null}
              </div>
            </div>
            <div className="rounded-[24px] border border-border p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Stock article</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {article ? <StockHealthBadge article={article} /> : <Badge variant="neutral">Article manquant</Badge>}
              </div>
            </div>
            <DetailTile label="Provenance" value={movement.source ?? "Non renseignée"} />
            <DetailTile
              label="Statut de version"
              value={
                movement.replacedByMovementId
                  ? "Version archivée"
                  : movement.replacesMovementId
                    ? "Version active après correction"
                    : "Version initiale"
              }
            />
            <div className="rounded-[24px] border border-border p-4 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Observation</p>
              <p className="mt-3 text-sm leading-7 text-foreground">{movement.note}</p>
            </div>
            {movement.correctionReason ? (
              <div className="rounded-[24px] border border-primary/20 bg-primary/5 p-4 sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.24em] text-primary">Motif de modification</p>
                <p className="mt-3 text-sm leading-7 text-foreground">{movement.correctionReason}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="bg-black text-white">
          <CardHeader>
            <Badge variant="warning" className="mb-3 w-fit">
              Impact stock
            </Badge>
            <CardTitle className="text-2xl text-white">Ce que change ce mouvement</CardTitle>
            <CardDescription className="text-white/68">
              Vue synthétique du stock juste avant, pendant et après l’opération.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <InsightRow
              icon={PackageSearch}
              title="Avant opération"
              detail={
                stockSnapshot
                  ? `${stockSnapshot.stockBefore} ${article?.unit ?? ""} étaient disponibles avant ce mouvement.`
                  : "Le calcul n’est plus direct sur cette version archivée."
              }
            />
            <InsightRow
              icon={Repeat2}
              title="Impact saisi"
              detail={`${movement.type === "entry" ? "+" : "-"}${movement.quantity} ${article?.unit ?? ""} enregistrés sur ce mouvement.`}
            />
            <InsightRow
              icon={History}
              title="Après opération"
              detail={
                stockSnapshot
                  ? `${stockSnapshot.stockAfter} ${article?.unit ?? ""} restaient après ce mouvement.`
                  : replacement
                    ? `Cette version a été remplacée le ${formatDateTime(replacement.date)}.`
                    : "Cette version n’impacte plus le stock actif."
              }
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <Card>
          <CardHeader>
            <Badge variant="neutral" className="mb-3 w-fit">
              Historique
            </Badge>
            <CardTitle className="text-2xl">Chaîne de modification</CardTitle>
            <CardDescription>
              Toutes les versions liées à ce mouvement pour suivre les corrections successives.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {movementHistory.map((item) => {
              const isCurrent = item.id === movement.id;
              const isArchived = Boolean(item.replacedByMovementId);

              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-[24px] border p-4",
                    isCurrent ? "border-primary bg-primary/5" : "border-border bg-muted/25"
                  )}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <MovementTypeBadge type={item.type} />
                        {isCurrent ? <Badge variant="default">Version consultée</Badge> : null}
                        {isArchived ? <Badge variant="neutral">Archivée</Badge> : null}
                      </div>
                      <p className="text-sm text-foreground">{item.note}</p>
                      {item.correctionReason ? (
                        <p className="text-sm text-primary">{item.correctionReason}</p>
                      ) : null}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground sm:text-right">
                      <p>{item.actor}</p>
                      <p>{formatDateTime(item.date)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Badge variant="neutral" className="mb-3 w-fit">
              Article lié
            </Badge>
            <CardTitle className="text-2xl">Mouvements récents de l’article</CardTitle>
            <CardDescription>
              Les dernières opérations sur cette référence pour remettre ce mouvement dans son contexte.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeArticleMovements.length ? (
              activeArticleMovements.slice(0, 6).map((item) => (
                <div key={item.id} className="rounded-[24px] border border-border bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <MovementTypeBadge type={item.type} />
                        {item.condition ? <ConditionBadge condition={item.condition} /> : null}
                      </div>
                      <p className="text-sm text-foreground">{item.note}</p>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground sm:text-right">
                      <p>{item.actor}</p>
                      <p>{formatDateTime(item.date)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-border p-6 text-sm text-muted-foreground">
                Aucun autre mouvement actif n’est disponible pour cet article.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {replacedMovement ? (
        <Card className="border-primary/15 bg-primary/5">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Mouvement d’origine lié</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Cette version corrige l’enregistrement du {formatDateTime(replacedMovement.date)}.
              </p>
            </div>
            <Link
              href={`/stock/movements/${replacedMovement.id}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Ouvrir la version d’origine
            </Link>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function buildMovementHistory(
  movement: Movement,
  movementById: Map<string, Movement>
) {
  let root = movement;

  while (root.replacesMovementId) {
    const previous = movementById.get(root.replacesMovementId);

    if (!previous) {
      break;
    }

    root = previous;
  }

  const history = [root];
  let current = root;

  while (current.replacedByMovementId) {
    const next = movementById.get(current.replacedByMovementId);

    if (!next) {
      break;
    }

    history.push(next);
    current = next;
  }

  return history;
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
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

function InsightRow({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof History;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="font-medium text-white">{title}</p>
          <p className="text-sm leading-6 text-white/68">{detail}</p>
        </div>
      </div>
    </div>
  );
}
