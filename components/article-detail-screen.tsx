"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight, History, ScanSearch } from "lucide-react";

import { useInventory } from "@/components/inventory-provider";
import { PageHeader } from "@/components/page-header";
import {
  ConditionBadge,
  MovementTypeBadge,
  RequestStatusBadge,
  StockHealthBadge,
} from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getBrandName, getCategoryName } from "@/lib/catalog";
import { formatDateTime } from "@/lib/format";

export function ArticleDetailScreen({ articleId }: { articleId: string }) {
  const { articles, brands, categories, movements, requests } = useInventory();
  const article = articles.find((item) => item.id === articleId);

  if (!article) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-4 p-6">
          <p className="text-lg font-medium">Article introuvable</p>
          <p className="text-sm text-muted-foreground">
            Cette fiche n existe pas dans le referentiel actuel.
          </p>
          <Link href="/stock/articles" className={buttonVariants({ variant: "outline" })}>
            Retour aux articles
          </Link>
        </CardContent>
      </Card>
    );
  }

  const articleMovements = movements.filter((movement) => movement.articleId === article.id);
  const articleRequests = requests.filter((request) => request.articleId === article.id);
  const totalOutputs = articleMovements
    .filter((movement) => movement.type === "output")
    .reduce((sum, movement) => sum + movement.quantity, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fiche article"
        title={article.name}
        description="Cette fiche concentre la tracabilite d une reference : niveau actuel, rythme de sortie, demandes associees et historique recent."
        actions={
          <>
            <Link
              href="/stock/articles"
              className={buttonVariants({ variant: "outline" })}
            >
              <ArrowLeft className="h-4 w-4" />
              Retour liste
            </Link>
            <Link href="/stock/requests" className={buttonVariants()}>
              Demander une sortie
            </Link>
          </>
        }
      />

      <section className="grid gap-4 lg:grid-cols-4">
        <InfoCard label="Stock actuel" value={`${article.availableQty} ${article.unit}`} />
        <InfoCard label="Seuil d alerte" value={`${article.alertThreshold} ${article.unit}`} />
        <InfoCard label="Sorties tracees" value={`${totalOutputs}`} />
        <InfoCard label="Demandes liees" value={`${articleRequests.length}`} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <Badge variant="neutral" className="mb-3 w-fit">
              Etat de reference
            </Badge>
            <CardTitle className="text-2xl">Synthese metier</CardTitle>
            <CardDescription>
              Les informations qui aident le magasinier a juger vite et juste.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <DetailTile label="Marque" value={getBrandName(brands, article.brandId)} />
            <DetailTile label="Reference" value={article.reference} />
            <DetailTile
              label="Categorie"
              value={getCategoryName(categories, article.categoryId)}
            />
            <DetailTile label="Emplacement" value={article.location} />
            <DetailTile label="Unite" value={article.unit} />
            <div className="rounded-[24px] border border-border p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Sante stock
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StockHealthBadge article={article} />
                <ConditionBadge condition={article.condition} />
              </div>
            </div>
            <div className="rounded-[24px] border border-border p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Lecture rapide
              </p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {article.availableQty <= article.alertThreshold
                  ? "Cette reference est deja sous seuil et doit rester sous surveillance rapprochee."
                  : "Le niveau reste exploitable, mais la consommation recente doit etre suivie."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black text-white">
          <CardHeader>
            <Badge variant="warning" className="mb-3 w-fit">
              Trajectoire de consommation
            </Badge>
            <CardTitle className="text-2xl text-white">
              Ce que cette fiche raconte
            </CardTitle>
            <CardDescription className="text-white/65">
              La decision n est pas seulement sur le stock actuel, mais sur sa
              vitesse de consommation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <InsightRow
              icon={ScanSearch}
              title="Trace recente"
              detail={`${articleMovements.length} mouvements relies a cette reference.`}
            />
            <InsightRow
              icon={History}
              title="Sorties cumulees"
              detail={`${totalOutputs} ${article.unit} sont deja sorties sur l historique visible.`}
            />
            <InsightRow
              icon={ArrowUpRight}
              title="Demandes en attente"
              detail={`${articleRequests.filter((request) => request.status === "pending").length} demande(s) encore a trancher.`}
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <Badge variant="neutral" className="mb-3 w-fit">
              Historique recent
            </Badge>
            <CardTitle className="text-2xl">Derniers mouvements</CardTitle>
            <CardDescription>
              Entrees, sorties, validations et refus relies a cet article.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {articleMovements.slice(0, 6).map((movement) => (
              <div
                key={movement.id}
                className="rounded-[24px] border border-border bg-muted/35 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <MovementTypeBadge type={movement.type} />
                    <p className="text-sm leading-6 text-muted-foreground">
                      {movement.note}
                    </p>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground sm:text-right">
                    <p>{movement.actor}</p>
                    <p>{formatDateTime(movement.date)}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Badge variant="neutral" className="mb-3 w-fit">
              Demandes associees
            </Badge>
            <CardTitle className="text-2xl">Sorties et decisions</CardTitle>
            <CardDescription>
              Qui a demande quoi, quand et avec quelle decision.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {articleRequests.length ? (
              articleRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-[24px] border border-border bg-white p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <p className="font-medium">{request.requester}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.quantity} {article.unit} · {request.jobReference}
                      </p>
                      <p className="text-sm text-muted-foreground">{request.reason}</p>
                      {request.reviewComment ? (
                        <p className="text-sm text-foreground">
                          Commentaire : {request.reviewComment}
                        </p>
                      ) : null}
                    </div>
                    <RequestStatusBadge status={request.status} />
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-border p-6 text-sm text-muted-foreground">
                Aucune demande n est encore associee a cette reference.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
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
